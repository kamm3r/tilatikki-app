import mongoose from "mongoose";
import Premise from "./models/Premise.js";
import Building from "./models/Building.js";
import Space from "./models/Space.js";
import Availability from "./models/Availability.js";
import User from "./models/User.js";
import * as config from "./utils/config.js";

// Percent coordinates traced from the filled rooms in the two demo floor plans.
const westRoom = [
  [8.339, 18.918], [8.343, 50.101], [17.001, 50.101], [17.001, 48.013],
  [17.415, 48.013], [17.415, 50.176], [19.372, 50.176], [19.372, 48.169],
  [20.695, 48.169], [20.695, 18.919],
];
const westSmallRoom = [
  [2.223, 18.927], [7.626, 18.927], [7.626, 50.084], [2.223, 50.084],
];
const northwestRoom = [
  [20.976, 22.916], [20.988, 19.008], [21.296, 19.007], [21.294, 16.740],
  [26.836, 16.740], [26.836, 11.101], [38.562, 11.101], [38.562, 12.117],
  [38.747, 12.117], [38.747, 32.399], [32.573, 32.396], [32.573, 36.897],
  [31.004, 36.866], [30.984, 32.297], [28.081, 32.391], [28.090, 33.153],
  [28.548, 33.144], [28.544, 39.971], [25.907, 39.968], [25.881, 33.132],
  [26.299, 33.106], [26.294, 32.460], [20.987, 32.387],
];
const northCenterRoom = [
  [57.853, 12.360], [57.853, 39.706], [56.691, 39.706], [56.691, 39.654],
  [45.580, 39.654], [45.580, 11.092], [56.937, 11.092], [56.937, 12.360],
];
const southCenterRoom = [
  [57.179, 78.503], [57.199, 79.842], [45.757, 79.842], [45.757, 51.196],
  [58.057, 51.196], [58.074, 78.485],
];
const eastRoom = [
  [88.888, 19.021], [88.888, 47.876], [76.914, 47.876], [76.914, 30.596],
  [76.611, 30.596], [76.611, 26.354], [76.914, 26.354], [76.914, 19.021],
];
const eastSmallRoom = [
  [94.793, 19.134], [94.793, 46.99], [94.358, 46.99], [94.358, 47.881],
  [94.267, 47.881], [94.267, 49.774], [92.594, 49.774], [92.594, 47.881],
  [91.424, 47.881], [91.424, 46.99], [89.324, 46.99], [89.324, 19.134],
];
const southeastRoom = [
  [71.958, 62.032], [76.114, 58.930], [92.058, 58.930], [92.058, 64.966],
  [95.360, 64.966], [95.360, 78.475], [94.372, 78.475], [94.372, 80.064],
  [77.363, 80.064], [77.363, 78.788], [75.679, 78.788], [75.679, 79.545],
  [72.037, 79.545],
];
const points = (coordinates: number[][]) => coordinates.map(([x, y]) => ({ x, y }));

async function seed() {
  if (config.node_env === "production" || !/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(config.mongoUri)) {
    throw new Error("The demo seed only runs against a local MongoDB database.");
  }
  await mongoose.connect(config.mongoUri);
  let user = await User.findOne({ email: "demo.user@edu.hel.fi" });
  if (!user) user = await User.create({
    _id: new mongoose.Types.ObjectId("6d8f1a7a0000000000000001"),
    firstname: "Demo", lastname: "User", email: "demo.user@edu.hel.fi", password: "DemoPassword1!",
  });

  let premise = await Premise.findOne({ name: "Pakilan Peruskoulu (demo)" });
  if (!premise) premise = await Premise.create({
    _id: new mongoose.Types.ObjectId("6d8f1a7a0000000000000002"),
    name: "Pakilan Peruskoulu (demo)", address: "Helsinki", users: [], buildings: [],
  });
  await Premise.updateOne({ _id: premise._id }, { $addToSet: { users: user._id } });
  // City of Helsinki Service Map, unit 76240 (Halkosuontie 88).
  const demoLocation = { latitude: 60.243484, longitude: 24.934855 };
  if (!premise.location) await Premise.updateOne({ _id: premise._id }, {
    $set: { address: "Halkosuontie 88, 00660 Helsinki", location: demoLocation },
  });
  await User.updateOne({ _id: user._id }, { $addToSet: { premises: premise._id } });

  let building = await Building.findOne({ name: "Päärakennus", _id: { $in: premise.buildings } });
  if (!building) building = await Building.create({ name: "Päärakennus", floors: 2, rooms: 0, space: [] });
  if (!building.location) building.location = demoLocation;
  building.blueprint = [
    { floor: 1, image: "/assets/pakilan-peruskoulu/kerros1.svg" },
    { floor: 2, image: "/assets/pakilan-peruskoulu/kerros2.svg" },
  ];
  await building.save();
  await Premise.updateOne({ _id: premise._id }, { $addToSet: { buildings: building._id } });

  const rooms = [
    { name: "Luokka A101", floor: 1, area: 48, mapPolygon: points(westRoom) },
    { name: "Luokka A102", floor: 1, mapPolygon: points(westSmallRoom) },
    { name: "Luokka A103", floor: 1, mapPolygon: points(northwestRoom) },
    { name: "Luokka A104", floor: 1, mapPolygon: points(northCenterRoom) },
    { name: "Luokka A105", floor: 1, mapPolygon: points(southCenterRoom) },
    { name: "Luokka A106", floor: 1, mapPolygon: points(eastRoom) },
    { name: "Luokka A107", floor: 1, mapPolygon: points(eastSmallRoom) },
    { name: "Luokka A108", floor: 1, mapPolygon: points(southeastRoom) },
    { name: "Luokka B201", floor: 2, area: 42, mapPolygon: points(eastSmallRoom) },
    { name: "Luokka B202", floor: 2, mapPolygon: points(westRoom) },
    { name: "Luokka B203", floor: 2, mapPolygon: points(westSmallRoom) },
    { name: "Luokka B204", floor: 2, mapPolygon: points(northwestRoom) },
    { name: "Luokka B205", floor: 2, mapPolygon: points(northCenterRoom) },
    { name: "Luokka B206", floor: 2, mapPolygon: points(southCenterRoom) },
    { name: "Luokka B207", floor: 2, mapPolygon: points(eastRoom) },
    { name: "Luokka B208", floor: 2, mapPolygon: points(southeastRoom) },
  ];
  const startdate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const enddate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  for (const room of rooms) {
    const space = await Space.findOneAndUpdate(
      { premise: premise._id, building: building._id, name: room.name },
      { $set: { ...room, premise: premise._id, building: building._id } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await Building.updateOne({ _id: building._id }, { $addToSet: { space: space._id } });
    // Leave existing windows intact so rerunning the seed cannot change their dates
    // or take ownership of availability that somebody created later.
    let availability = await Availability.findOne({ space: space._id });
    if (!availability) availability = await Availability.create({
      startdate, enddate, premise: premise._id, space: space._id, creator: user._id,
    });
    await Space.updateOne({ _id: space._id }, { $addToSet: { availabilities: availability._id } });
    if (availability.creator?.equals(user._id)) {
      await User.updateOne({ _id: user._id }, { $addToSet: { availabilities: availability._id } });
    }
  }
  await Building.updateOne({ _id: building._id }, {
    $set: { rooms: await Space.countDocuments({ building: building._id }) },
  });
  console.log(`Demo premise: http://localhost:${config.port}/premises/${premise._id}`);
  console.log("Demo login: demo.user@edu.hel.fi / DemoPassword1!");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
