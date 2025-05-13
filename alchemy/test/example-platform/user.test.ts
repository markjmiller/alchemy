import { describe, expect } from "bun:test";
import { alchemy } from "../../src/alchemy";
import { destroy } from "../../src/destroy";
import { ExamplePlatformApi, User } from "../../src/example-platform/user";
import { BRANCH_PREFIX } from "../util";
// must import this or else alchemy.test won't exist
import "../../src/test/bun";

const api = new ExamplePlatformApi();

const test = alchemy.test(import.meta);

describe("User Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-user`;
  const orgId = "fe110c72385f49a4ad721a26cdd0f730";

  test("create, update, and delete user", async (scope) => {
    let user: User | undefined;
    try {
      // Create a test user
      user = await User(testId, {
        orgId: orgId,
        firstName: "Test",
        lastName: "User",
        funFact: "I am a test user"
      });

      expect(user.id).toBeTruthy();
      expect(user.firstName).toEqual("Test");
      expect(user.lastName).toEqual("User");
      expect(user.funFact).toEqual("I am a test user");

      // Verify user was created by querying the API directly
      const getResponse = await api.get(`/org/${orgId}/user/${user.id}`);
      expect(getResponse.status).toEqual(200);

      const responseData = await getResponse.json();
      expect(responseData.firstName).toEqual("Test");
      expect(responseData.lastName).toEqual("User");
      expect(responseData.funFact).toEqual("I am a test user");

      // Update the user
      user = await User(testId, {
        orgId: "fe110c72385f49a4ad721a26cdd0f730",
        firstName: "Updated",
        lastName: "User",
        funFact: "I am an updated test user"
      });

      expect(user.id).toBeTruthy();
      expect(user.firstName).toEqual("Updated");
      expect(user.lastName).toEqual("User");
      expect(user.funFact).toEqual("I am an updated test user");

      // Verify user was updated
      const getUpdatedResponse = await api.get(`/org/${orgId}/user/${user.id}`);
      const updatedData = await getUpdatedResponse.json();
      expect(updatedData.firstName).toEqual("Updated");
      expect(updatedData.lastName).toEqual("User");
      expect(updatedData.funFact).toEqual("I am an updated test user");
    } catch(err) {
      // log the error or else it's silently swallowed by destroy errors
      console.log(err);
      throw err;
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify user was deleted
      const getDeletedResponse = await api.get(`/org/${orgId}/user/${user?.id}`);
      expect(getDeletedResponse.status).toEqual(404);
    }
  });
}); 