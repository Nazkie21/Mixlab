const validateBooking = (req, res, next) => {
  const { name, date, hours } = req.body;

  // Validate name
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  // Validate date
  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    return res.status(400).json({ message: 'Cannot book a date in the past' });
  }

  // Validate hours
  const hoursNum = parseInt(hours);
  if (!hours || hoursNum < 1 || hoursNum > 4) {
    return res.status(400).json({ message: 'Hours must be between 1 and 4' });
  }

  next();
};

export { validateBooking };