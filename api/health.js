// Vercel Serverless Function — health / usage info
module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    name: "Barcode API",
    ok: true,
    usage: "/barcode?type=qrcode&data=Hello&format=png",
    formats: ["png", "svg"],
    example: "/barcode?type=code128&data=ABC-123&scale=3&includetext=1"
  });
};
