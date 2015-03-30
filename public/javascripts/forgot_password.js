(function() {
  "use strict";

  $('#reset-password').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#new-password-form').parsley({
    successClass: 'success',
    errorClass: 'error'
  });


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
    var userID = $('#user-id').val();
    console.log(userID);
    $.ajax({
      url: 'users/' + userID,
      type: 'PUT',
      data: {new_password: $('#new-password').val()},
      success: function(){
        swal("Sucess!", "Your password has been reset.", "success");
        setTimeout(function() {
          location.href = "/";
        }, 1000);
      },
      error: function(err) {
        swal("Oops!", "Something went wrong.", "error");
      }
    });
    return false;
  });
}());
