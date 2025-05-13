import type { Context } from "../context";
import { Resource } from "../resource";

/**
 * Properties for creating or updating a User
 */
export interface UserProps {
  /**
   * Id of the organization to add the user to
   */
  orgId: string;

  /**
   * First name of the user
   */
  firstName: string;

  /**
   * Last name of the user
   */
  lastName: string;

  /**
   * An interesting fact about the user
   */
  funFact?: string;
}

/**
 * A User resource
 */
export interface User extends Resource<"example-platform::User">, UserProps {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * Time at which the user was created
   */
  createdAt: number;
}

/**
 * Response type from Example Platform API user endpoints
 */
interface ExamplePlatformUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  funFact?: string;
}

/**
 * Options for Example Platform API requests
 */
export interface ExamplePlatformApiOptions {
  /**
   * API url to use (overrides environment variable)
   */
  apiUrl?: string;
}

/**
 * Minimal API client using raw fetch
 */
export class ExamplePlatformApi {
  /** Base URL for API */
  readonly baseUrl: string;

  /**
   * Create a new API client
   *
   * @param options API options
   */
  constructor(options: ExamplePlatformApiOptions = {}) {
    // Initialize with environment variables or provided values
    this.baseUrl = options.apiUrl || "https://example-third-part-platform.replace-me.workers.dev/api";
  }

  /**
   * Make a request to the API
   */
  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    // Set up authentication headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    // Add headers from init if provided
    if (init.headers) {
      const initHeaders = init.headers as Record<string, string>;
      Object.keys(initHeaders).forEach(key => {
        headers[key] = initHeaders[key];
      });
    }

    // Make the request
    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });
  }

  /**
   * Helper for GET requests
   */
  async get(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "GET" });
  }

  /**
   * Helper for POST requests
   */
  async post(path: string, body: any, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "POST", body: JSON.stringify(body) });
  }

  /**
   * Helper for PATCH requests
   */
  async patch(path: string, body: any, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "PATCH", body: JSON.stringify(body) });
  }

  /**
   * Helper for DELETE requests
   */
  async delete(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "DELETE" });
  }
}

/**
 * Create and manage Users in the Example Platform
 * 
 * @example
 * // Create a new user
 * const user = await User("john-doe", {
 *   orgId: "fe110c72385f49a4ad721a26cdd0f730",
 *   firstName: "John",
 *   lastName: "Doe",
 *   funFact: "I love coding!"
 * });
 * 
 * @example
 * // Update an existing user
 * const updatedUser = await User("john-doe", {
 *   orgId: "fe110c72385f49a4ad721a26cdd0f730",
 *   firstName: "John",
 *   lastName: "Doe",
 *   funFact: "I also love coffee!"
 * });
 */
export const User = Resource(
  "example-platform::User",
  async function(this: Context<User>, id: string, props: UserProps): Promise<User> {
    // Initialize API client
    const api = new ExamplePlatformApi({apiUrl: process.env.API_URL});

    if (this.phase === "delete") {
      try {
        if (this.output?.id) {
          // Delete user
          const deleteResponse = await api.delete(`/org/${props.orgId}/user/${this.output.id}`);

          // Check response status directly instead of relying on exceptions
          if (!deleteResponse.ok && deleteResponse.status !== 404) {
            console.error("Error deleting user:", deleteResponse.statusText);
          }
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }

      // Return destroyed state
      return this.destroy();
    } else {
      try {
        let response;

        if (this.phase === "update" && this.output?.id) {
          // Update existing user
          response = await api.patch(
            `/org/${props.orgId}/user/${this.output.id}`,
            {
              firstName: props.firstName,
              lastName: props.lastName,
              funFact: props.funFact
            }
          );
        } else {
          // Create new user
          response = await api.post(
            `/org/${props.orgId}/users`,
            {
              firstName: props.firstName,
              lastName: props.lastName,
              funFact: props.funFact
            }
          );
        }

        // Check response status directly
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        // Parse response JSON
        const data = await response.json() as ExamplePlatformUserResponse;

        // Return the user using this() to construct output
        return this({
          id: data.id,
          orgId: props.orgId,
          firstName: data.firstName,
          lastName: data.lastName,
          funFact: data.funFact,
          createdAt: Date.now()
        });
      } catch (error) {
        console.error("Error creating/updating user:", error);
        throw error;
      }
    }
  }
);
