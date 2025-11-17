// contact-form.js

$(document).ready(function () {
  $('.contact-form').on('submit', function (e) {
    e.preventDefault();

    // Collect form data from inputs
    const formData = {
      name: $('#name').val().trim(),
      email: $('#email').val().trim(),
      subject: $('#subject').val().trim(),
      message: $('#message').val().trim(),
      vendorid: 'vendor-1' // Or get this dynamically if needed
    };

    // Wrap in 'data' key as expected by Strapi
    const payload = {
      data: formData
    };

    // Send POST request
    $.ajax({
      url: 'http://localhost:1337/api/contactuses',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (response) {
        alert('Message sent successfully!');
        console.log('Server response:', response);
        $('.contact-form')[0].reset(); // Reset the form
      },
      error: function (xhr, status, error) {
        alert('Failed to send message. Please try again.');
        console.error('Error:', xhr.responseText);
      }
    });
  });
});
