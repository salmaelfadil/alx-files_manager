const express = require('express');
const routes = require('./routes/index.js');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(routes);

app.listen(port, (error) => {
  if (error) {
    console.error(error.message);
  } else {
    console.log(`Server is running on port: ${port}`);
  }
});
