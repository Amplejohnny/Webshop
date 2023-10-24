import mongoose from "mongoose";

function connect() {
  const { MONGO_URI } = process.env;

  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Successfully connected to the database');
    })
    .catch((error) => {
      console.log('Database connection failed. Exiting now...');
      console.error(error);
      process.exit(1);
    });
}

export default connect;