# HTML Form Email Function

## Overview

This function facilitates email submission from HTML forms using Appwrite. It validates form data, sends the email through an SMTP server, and handles redirection based on the success or failure of the submission.

## Usage

### HTML Form

To use this function, set the `action` attribute of your HTML form to your function URL, and the `method` attribute to `post`.

```html
<form action="{{YOUR_FUNCTION_URL}}" method="post">
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="hidden" name="_next" value="{{YOUR_SUCCESS_PATH}}" />
  <textarea name="message" placeholder="Your Message" required></textarea>
  <button type="submit">Submit</button>
</form>
```

## Environment Variables

This function depends on the following environment variables:

- **SMTP_HOST** - SMTP server host
- **SMTP_PORT** - SMTP server port
- **SMTP_USERNAME** - SMTP server username
- **SMTP_PASSWORD** - SMTP server password
- **SUBMIT_EMAIL** - The email address to send form submissions

## Request

### Form Data

- **name** - The sender's name
- **email** - The sender's email address
- **message** - The message to be sent

## Response

### Success Redirect

On successful form submission, the function will redirect users to the URL provided in the `_next` form data.

### Error Redirect

In the case of errors such as invalid request methods, missing form data, or SMTP configuration issues, the function will redirect users back to the form URL with an appended error code for more precise error handling. Error codes include `invalid-request`, `missing-form-data`, and generic `server-error`.
