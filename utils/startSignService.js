// sign-service (DSC signing, Python) backend सोबत आपोआप चालू होते.
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const SERVICE_DIR = path.join(ROOT, "sign-service");
const IS_WIN = process.platform === "win32";
const VENV_PY = path.join(SERVICE_DIR, "venv", IS_WIN ? "Scripts" : "bin", IS_WIN ? "python.exe" : "python");

const log = (...a) => console.log("[sign-service]", ...a);

function healthOk(baseUrl) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function run(cmd, args, cwd = SERVICE_DIR) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  return r.status === 0;
}

// पहिल्यांदाच: Python venv + packages
function ensureVenv() {
  if (fs.existsSync(VENV_PY)) return true;
  log("venv नाही - पहिल्यांदा setup करत आहे (1-2 मिनिटे लागतील)...");
  const sysPy = IS_WIN ? "python" : "python3";
  if (!run(sysPy, ["-m", "venv", "venv"])) {
    log("Python venv बनवता आला नाही. Linux server वर एकदा चालवा: apt install -y python3-venv python3-pip");
    return false;
  }
  if (!run(VENV_PY, ["-m", "pip", "install", "-r", "requirements.txt"])) {
    log("pip install fail झाले. Internet / requirements.txt तपासा.");
    return false;
  }
  return true;
}

// Dummy certificates (.pfx) नसतील तर Linux वर आपोआप बनवा
function ensureDummyCerts() {
  const dir = path.join(SERVICE_DIR, "dummy-certs");
  if (!fs.existsSync(dir)) return;
  if (fs.readdirSync(dir).some((f) => f.endsWith(".pfx"))) return;
  const script = path.join(dir, "make-dummy-certs.sh");
  if (IS_WIN || !fs.existsSync(script)) {
    log("dummy-certs मध्ये .pfx नाहीत - signing fail होईल.");
    return;
  }
  fs.writeFileSync(script, fs.readFileSync(script, "utf8").replace(/\r\n/g, "\n"));
  log("dummy certificates बनवत आहे...");
  run("bash", ["make-dummy-certs.sh"], dir);
}

module.exports = async function startSignService() {
  try {
    if (String(process.env.DSC_ENABLED).toLowerCase() !== "true") return;
    if (String(process.env.SIGN_SERVICE_AUTOSTART).toLowerCase() === "false") return;

    const baseUrl = (process.env.SIGN_SERVICE_URL || "http://127.0.0.1:7001").replace(/\/+$/, "");
    const u = new URL(baseUrl);
    if (!["127.0.0.1", "localhost"].includes(u.hostname)) return;

    if (await healthOk(baseUrl)) {
      log("आधीच चालू आहे:", baseUrl);
      return;
    }
    if (!fs.existsSync(path.join(SERVICE_DIR, "app.py"))) {
      log("folder सापडला नाही:", SERVICE_DIR);
      return;
    }
    if (!ensureVenv()) return;
    ensureDummyCerts();

    let child = null;
    let stopping = false;
    let restarts = 0;

    const start = () => {
      child = spawn(
        VENV_PY,
        ["-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", String(u.port || 7001)],
        {
          cwd: SERVICE_DIR,
          stdio: "inherit",
          env: {
            ...process.env,
            SIGN_SERVICE_KEY: process.env.SIGN_SERVICE_KEY || "",
            UPLOADS_DIR: process.env.UPLOADS_DIR || path.join(ROOT, "uploads"),
          },
        }
      );
      log(`सुरू केली (pid ${child.pid}) -> ${baseUrl}`);

      child.on("exit", (code) => {
        if (stopping) return;
        restarts += 1;
        const wait = Math.min(30000, 2000 * restarts);
        log(`बंद पडली (code ${code}). ${wait / 1000}s नंतर पुन्हा सुरू करत आहे...`);
        setTimeout(start, wait);
      });
      child.on("error", (err) => log("सुरू करताना error:", err.message));
    };

    start();

    const stop = () => {
      stopping = true;
      if (child && !child.killed) child.kill();
    };
    process.on("exit", stop);
    ["SIGINT", "SIGTERM"].forEach((sig) =>
      process.once(sig, () => {
        stop();
        process.exit(0);
      })
    );
  } catch (err) {
    log("error:", err.message);
  }
};