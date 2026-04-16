const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb+srv://eschool_admin:Thanh2009%40@eschool-cluster.ugnp8pv.mongodb.net/eschool_ai');
  const db = mongoose.connection.useDb('eschool_ai');
  const cols = await db.listCollections().toArray();
  console.log(cols.map(c => c.name));
  process.exit();
}
run();
