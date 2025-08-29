/** @format */
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from '../utils/logger';
import chalk from 'chalk';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(chalk.bold.yellow(`Server is running on port ${port}`));
});
