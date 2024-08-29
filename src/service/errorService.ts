import { userLogger, dbLogger, middlewareLogger } from "../logger";
import { Response } from "express";

class errorService {
  //Method to handle client errors (400-level)
  public static handleClientError(
    res: Response,
    statusCode: number,
    message: string,
    details?: any,
    logger = userLogger
  ) {
    logger.error(message, { details: details || message });
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: {
        code: statusCode,
        details: details || message,
      },
    });
  }

  //Method to handle server errors (500-level)
  public static handleServerError(
    res: Response,
    error: Error,
    message: string = "Internal server error",
    logger = userLogger
  ) {
    logger.error(message, { error: error.stack || error });
    console.error(message, error); //Log the error for debugging
    return res.status(500).json({
      success: false,
      message: message,
      error: {
        code: 500,
        details: error.message,
      },
    });
  }

  // Method to handle not found errors (404)
  public static handleNotFoundError(
    res: Response,
    message: string = "Resource not found"
  ) {
    res.status(404).json({
      success: false,
      message: message,
      error: {
        code: 404,
        details: message,
      },
    });
  }

  //Method to handle unauthorized errors (401)
  public static handleUnauthorizedError(
    res: Response,
    message: string = "Unauthorized access"
  ) {
    res.status(401).json({
      success: false,
      message: message,
      error: {
        code: 403,
        details: message,
      },
    });
  }

  // Method to handle forbidden errors (403)
  public static handleForbiddenError(
    res: Response,
    message: string = "Access forbidden"
  ) {
    res.status(403).json({
      success: false,
      message: message,
      error: {
        code: 403,
        details: message,
      },
    });
  }
}

export default errorService;

/*
 *
 * Informatiional responses (100 - 199)
 *    - 100 Continue:                               The server has received the initial part of request, and the client should continue with rest of the request.
 *    - 101 Switching Protocols:                    The server understands the request to switch protocols and is willing to comply
 *    - 102 Processing (WebDAV):                    The server is processiong the request but hasn't completed it yet.
 * Successful responses     (200 - 299)
 *    - 200 OK:                                     The request has succeeded. The meaning of the success depends on the HTTP method (GET, POST, etc)
 *    - 201 Created:                                The requested has been fulfilled, leading to the creation of a new resource.
 *    - 202 Accepted:                               The request has been accepted for processing, but the processing is not yet complete.
 *    - 204 No Content:                             The server successfully processed the request, but there's no content to return.
 * Redirection messages     (300 - 399)
 *    - 301 Moved Premanently:                      The requested resource has been permanently moved to a new URL.
 *    - 302 Found (Previously "Moved Temporarily"): The requested resource resides temporarily under a different URL.
 *    - 304 Not Modified:                           The resource has not been modified since the last request, so the client can use the cached version.
 *    - 307 Temporary Redirect:                     The request should be repeated with another URL, but future requests should still use the orginial URL.
 * Client error responses   (400 - 499)
 *    - 400 Bad Request:                            The server cannot process the request due to a client error (e.g. malformed request syntax).
 *    - 401 Unautherized:                           Authentication is required, and the client must authenticate itself to get the requested response.
 *    - 403 Forbidden:                              The server understands teh request but refuses to authorize it.
 *    - 404 Not Found:                              The requested resource could not be found on the server.
 *    - 405 Method Not Allowed:                     The method specified in the request is not allowed for the resource identified by the URL.
 * Server error responses   (500 - 599)
 *    - 500 Internal Server Error:                  The server encounted an unexpected condition that prevented it from fulfilling the request.
 *    - 501 Not Implemented:                        The server does not support the functionality required to fulfill the request.
 *    - 502 Bad Gateway:                            The server, while acting as a gateway or proxy, receicved an invaldi response form an upstream server.
 *    - 503 Service Unavailable:                    The server is not ready to handle the request, usually due to being overloaded or down for maintenance.
 *    - 504 Gateway Timeout:                        The server, acting as a gateway or proxy, did not receive a timely response form the upstream server.
 *
 */
