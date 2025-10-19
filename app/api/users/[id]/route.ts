import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withValidation } from '@/lib/middleware/validation';
import { UserService } from '@/services/user.service';
import { updateUserSchema } from '@/lib/validations/schemas';

const userService = new UserService();
const rateLimit = withRateLimit();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        // Users can only access their own data unless they're admin
        if (token.role !== 'admin' && token.uid !== id) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }

        const user = await userService.getUserById(id);
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: user,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch user' },
          { status: 500 }
        );
      }
    }
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withValidation(
    updateUserSchema,
    async (req, data) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { id } = params;
            
            // Users can only update their own data unless they're admin
            if (token.role !== 'admin' && token.uid !== id) {
              return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
              );
            }

            const user = await userService.updateUser(id, data);

            return NextResponse.json({
              success: true,
              data: user,
              message: 'User updated successfully',
            });
          } catch (error) {
            console.error('Error updating user:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to update user' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(
    request,
    async (req, token) => {
      try {
        const { id } = params;
        
        // Only admins can delete users
        if (token.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }

        await userService.deleteUser(id);

        return NextResponse.json({
          success: true,
          message: 'User deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete user' },
          { status: 500 }
        );
      }
    }
  );
}
