document.getElementById("submitBooking").addEventListener("click", async () => {
  const name = document.getElementById('name').value;
  const date = document.getElementById('date').value;
  const hours = document.getElementById('hours').value;

  // Fixed: removed submitBooking from data
  const data = { name, date, hours };

  try {
    const res = await fetch("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const msg = await res.json();
    document.getElementById("bookingMsg").textContent = msg.message;
    
    // Optional: Clear form on success
    if (res.ok) {
      document.getElementById('bookingForm').reset();
    }
  } catch (error) {
    document.getElementById("bookingMsg").textContent = "Network error. Please try again.";
  }
});