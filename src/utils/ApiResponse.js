  class ApiResponse {
  constructor(statusCode, data, message= "Suceess") {
    this.status = statusCode;
    this.data = data;
    this.message = message;
    this.suceess = statusCode < 400;
  }
}   


export {ApiResponse}