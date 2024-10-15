export const getPasswordResetEmail = (url: string) => ({
  subject: "Velkommen til Folkekraft!",
  text: `${process.env.FRONTEND_URL}${url}`,
  html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <link
      rel="preload"
      as="image"
      href="https://utfs.io/f/1c66qeb7SCm5YmfZi4ybcQKOgLiwrEyTUDXzp5sHV1kNR4d9"
    />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <!--$-->
  </head>
  

  <body
    style="
      background-color: #f6f9fc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        'Helvetica Neue', Ubuntu, sans-serif;
    "
  >
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="
        max-width: 37.5em;
        background-color: #ffffff;
        margin: 0 auto;
        padding: 20px 0 48px;
        margin-bottom: 64px;
        margin-top: 64px;
      "
    >
      <tbody>
        <tr style="width: 100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="padding: 0 48px"
            >
              <tbody>
                <tr>
                  <td>
                    <img
                      alt="Folkekraft"
                      src="https://utfs.io/f/1c66qeb7SCm5YmfZi4ybcQKOgLiwrEyTUDXzp5sHV1kNR4d9"
                      style="
                        display: block;
                        outline: none;
                        border: none;
                        text-decoration: none;
                        width: 200px;
                      "
                    />
                    <hr
                      style="
                        width: 100%;
                        border: none;
                        border-top: 1px solid #eaeaea;
                        border-color: #e6ebf1;
                        margin: 20px 0;
                      "
                    />
                    <p
                      style="
                        font-size: 16px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: #525f7f;
                        text-align: left;
                      "
                    >
                      Takk for at du har lyst å bli en del av Folkekraft. Du er
                      nå klar til å komme i gang med Folkekraft!
                    </p>
                    <p
                      style="
                        font-size: 16px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: #525f7f;
                        text-align: left;
                      "
                    >
                      Denne portal skal gi gi deg oversikt over aksjene dine i
                      Folkekraft, etterhvert vil du også få tilgang til strøm og
                      aksje i samme portal.
                    </p>
                    <a
                      href="${process.env.FRONTEND_URL}${url}"
                      style="
                        line-height: 100%;
                        text-decoration: none;
                        display: block;
                        max-width: 100%;
                        mso-padding-alt: 0px;
                        background-color: #00263d;
                        border-radius: 5px;
                        color: #fff;
                        font-size: 16px;
                        font-weight: bold;
                        text-align: center;
                        width: 100%;
                        padding: 10px 10px 10px 10px;
                      "
                      target="_blank"
                      ><span
                        ><!--[if mso
                          ]><i
                            style="mso-font-width: 500%; mso-text-raise: 15"
                            hidden
                            >&#8202;</i
                          ><!
                        [endif]--></span
                      ><span
                        style="
                          max-width: 100%;
                          display: inline-block;
                          line-height: 120%;
                          mso-padding-alt: 0px;
                          mso-text-raise: 7.5px;
                        "
                        >Sjekk ut Folkekraft!</span
                      ><span
                        ><!--[if mso
                          ]><i style="mso-font-width: 500%" hidden
                            >&#8202;&#8203;</i
                          ><!
                        [endif]--></span
                      ></a
                    >
                    <hr
                      style="
                        width: 100%;
                        border: none;
                        border-top: 1px solid #eaeaea;
                        border-color: #e6ebf1;
                        margin: 20px 0;
                      "
                    />
                    <p
                      style="
                        font-size: 16px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: #525f7f;
                        text-align: left;
                      "
                    >
                      Vi er stadig under utvikling og ønsker å skape det beste
                      opplevelse for deg. Plattform er ikke helt perfekt ikke
                      uten din hjelp. Om du mener vi bør utvikle eller legge til
                      funksjon kan du ta kontakt med oss på
                      <!-- -->
                      <a
                        href="mailto:hei@folkekraft.no"
                        style="color: #57c7b7; text-decoration: none"
                        target="_blank"
                        >hei@folkekraft.no</a
                      >
                      <!-- -->.
                    </p>
                    <p
                      style="
                        font-size: 16px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: #525f7f;
                        text-align: left;
                      "
                    >
                      Det som er så fint med Folkekraft er at det er du som
                      bestemmer hvordan vi skal styre Folkekraft!
                    </p>

                    <p
                      style="
                        font-size: 16px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: #525f7f;
                        text-align: left;
                      "
                    >
                      — Folkekraft familie
                    </p>
                    <hr
                      style="
                        width: 100%;
                        border: none;
                        border-top: 1px solid #eaeaea;
                        border-color: #e6ebf1;
                        margin: 20px 0;
                      "
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`,
});
