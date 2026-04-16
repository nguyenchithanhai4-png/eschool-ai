const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://eschool_admin:Thanh2009%40@eschool-cluster.ugnp8pv.mongodb.net/eschool_ai');
  const db = mongoose.connection.useDb('eschool_ai');
  const items = await db.collection('users').find({}).toArray();
  console.log(items.map(i => i.email + " | " + i.role));
  process.exit();
}
run();
