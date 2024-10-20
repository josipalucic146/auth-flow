import { connect } from './database';
import app from './app';

connect();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
