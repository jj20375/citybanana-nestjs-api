export interface IGoogleUserAccessToken {
    /**
     * The application that is the intended user of the access token.
     */
    aud: string;
    /**
     * This value lets you correlate profile information from multiple Google
     * APIs. It is only present in the response if you included the profile scope
     * in your request in step 1. The field value is an immutable identifier for
     * the logged-in user that can be used to create and manage user sessions in
     * your application. The identifier is the same regardless of which client ID
     * is used to retrieve it. This enables multiple applications in the same
     * organization to correlate profile information.
     */
    user_id?: string;
    /**
     * An array of scopes that the user granted access to.
     */
    scopes: string[];
    /**
     * The datetime when the token becomes invalid.
     */
    expiry_date: number;
    /**
     * An identifier for the user, unique among all Google accounts and never
     * reused. A Google account can have multiple emails at different points in
     * time, but the sub value is never changed. Use sub within your application
     * as the unique-identifier key for the user.
     */
    sub?: string;
    /**
     * The client_id of the authorized presenter. This claim is only needed when
     * the party requesting the ID token is not the same as the audience of the ID
     * token. This may be the case at Google for hybrid apps where a web
     * application and Android app have a different client_id but share the same
     * project.
     */
    azp?: string;
    /**
     * Indicates whether your application can refresh access tokens
     * when the user is not present at the browser. Valid parameter values are
     * 'online', which is the default value, and 'offline'. Set the value to
     * 'offline' if your application needs to refresh access tokens when the user
     * is not present at the browser. This value instructs the Google
     * authorization server to return a refresh token and an access token the
     * first time that your application exchanges an authorization code for
     * tokens.
     */
    access_type?: string;
    /**
     * The user's email address. This value may not be unique to this user and
     * is not suitable for use as a primary key. Provided only if your scope
     * included the email scope value.
     */
    email?: string;
    /**
     * True if the user's e-mail address has been verified; otherwise false.
     */
    email_verified?: boolean;
}

export interface IGoogleUserInfo {
    /**
     * The user's email address.
     */
    email?: string | null;
    /**
     * The user's last name.
     */
    family_name?: string | null;
    /**
     * The user's gender.
     */
    gender?: string | null;
    /**
     * The user's first name.
     */
    given_name?: string | null;
    /**
     * The hosted domain e.g. example.com if the user is Google apps user.
     */
    hd?: string | null;
    /**
     * The obfuscated ID of the user.
     */
    id?: string | null;
    /**
     * URL of the profile page.
     */
    link?: string | null;
    /**
     * The user's preferred locale.
     */
    locale?: string | null;
    /**
     * The user's full name.
     */
    name?: string | null;
    /**
     * URL of the user's picture image.
     */
    picture?: string | null;
    /**
     * Boolean flag which is true if the email address is verified. Always verified because we only return the user's primary email address.
     */
    verified_email?: boolean | null;

    /**
     * google id
     */
    sub?: string | number;
}
