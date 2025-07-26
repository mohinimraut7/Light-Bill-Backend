 exports.getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 50;

    const total = await Bill.countDocuments();

    const bills = await Bill.find()
      .skip(page * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // optional sorting

    res.json({
      total,
      bills,
    });
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};