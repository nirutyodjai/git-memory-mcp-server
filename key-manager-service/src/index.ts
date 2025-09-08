import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Key Manager Service is running!');
});

app.listen(port, () => {
  console.log(`Key Manager Service listening at http://localhost:${port}`);
});