const express = require('express');
// const routes = require('./routes/index.js');

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, (error) => {
  if (error) {
    console.error(error.message);
  } else {
    console.log('APP Started Successfully');
  }
});

// app.use('/', routes);
