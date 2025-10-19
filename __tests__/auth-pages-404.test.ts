/**
 * Tests to verify that auth pages return 404 after removal
 */

import { describe, it, expect } from '@jest/globals';

describe('Auth Pages 404 Tests', () => {
  describe('Static Import Checks', () => {
    it('should not be able to import signin page', async () => {
      // Test that signin page cannot be imported
      expect(() => {
        require('@/app/(auth)/signin/page');
      }).toThrow();
    });

    it('should not be able to import signup page', async () => {
      // Test that signup page cannot be imported
      expect(() => {
        require('@/app/(auth)/signup/page');
      }).toThrow();
    });

    it('should not be able to import auth layout', async () => {
      // Test that auth layout cannot be imported
      expect(() => {
        require('@/app/(auth)/layout');
      }).toThrow();
    });
  });

  describe('File System Checks', () => {
    it('should not have auth directory in app', async () => {
      // Test that auth directory does not exist
      const fs = require('fs');
      const path = require('path');
      
      const authDir = path.join(process.cwd(), 'app', '(auth)');
      expect(fs.existsSync(authDir)).toBe(false);
    });

    it('should not have auth components directory', async () => {
      // Test that auth components directory does not exist
      const fs = require('fs');
      const path = require('path');
      
      const authComponentsDir = path.join(process.cwd(), 'components', 'auth');
      expect(fs.existsSync(authComponentsDir)).toBe(false);
    });

    it('should not have NextAuth API route', async () => {
      // Test that NextAuth API route does not exist
      const fs = require('fs');
      const path = require('path');
      
      const nextAuthRoute = path.join(process.cwd(), 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
      expect(fs.existsSync(nextAuthRoute)).toBe(false);
    });
  });
});
