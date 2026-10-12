#!/usr/bin/env bash
# फक्त TESTING साठी dummy DSC तयार करतो. Production मध्ये हे वापरू नका.
set -e
PASS=${PFX_PASS:-test1234}
openssl req -x509 -newkey rsa:2048 -nodes -days 1825 -keyout ca.key -out ca.crt \
  -subj "/C=IN/O=VVCMC TEST ONLY/CN=VVCMC Dummy CA (NOT VALID)" \
  -addext "basicConstraints=critical,CA:TRUE" -addext "keyUsage=critical,keyCertSign,cRLSign"
mk () { # $1=file id  $2=Common Name  $3=designation
  openssl req -newkey rsa:2048 -nodes -keyout $1.key -out $1.csr -subj "/C=IN/O=Vasai Virar City Municipal Corporation/OU=$3/CN=$2"
  printf "keyUsage=critical,digitalSignature,nonRepudiation\nextendedKeyUsage=emailProtection,1.3.6.1.4.1.311.10.3.12\n" > ext.cnf
  openssl x509 -req -in $1.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 730 -out $1.crt -extfile ext.cnf
  openssl pkcs12 -export -inkey $1.key -in $1.crt -certfile ca.crt -out $1.pfx -passout pass:$PASS -name "$2"
  rm -f $1.csr ext.cnf
}
mk lipik            "DUMMY LIPIK"                 "Lipik Electrical Dept"
mk je_ward          "DUMMY JE WARD"               "Junior Engineer Ward"
mk je_ho            "DUMMY JE HEAD OFFICE"        "Junior Engineer Head Office"
mk accountant       "DUMMY ACCOUNTANT"            "Accountant"
mk amc              "DUMMY ASST COMMISSIONER"     "Assistant Municipal Commissioner"
mk dmc              "DUMMY DY COMMISSIONER"       "Dy Municipal Commissioner"
rm -f *.key ca.srl
echo "Done. PFX password: $PASS"
