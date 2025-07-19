
function errorHandler(err, res) {
  console.error(err);
  res.status(500).json({ message: 'An internal server error occurred.' });
}

export default errorHandler;
