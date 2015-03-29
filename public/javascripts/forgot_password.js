(function() {
  "use strict";

  $('#reset-password').submit(function(){
    $.ajax({
      url: 'forgot_password',
      type: 'POST',
      data: {email: $('#reset-password-email').val()},
      success: function(){
        swal("Email Sent", "Please check your email to reset your password.", "success");
      },
      error: function(err) {
        swal("Oops!", "Please make sure you have not already signed up with this email.", "error");
      }
    });
    return false;
  });

  $('#new-password-form').submit(function(){
    $.ajax({
      url: 'users/',
      type: 'POST',
      data: {email: $('#reset-password-email').val()},
      success: function(){
        swal("Email Sent", "Please check your email to reset your password.", "success");
      },
      error: function(err) {
        swal("Oops!", "Please make sure you have not already signed up with this email.", "error");
      }
    });
    return false;
  });
}());
