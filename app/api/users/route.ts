import { NextRequest, NextResponse } from 'next/server';

import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withValidation } from '@/lib/middleware/validation';
import { UserService } from '@/services/user.service';
import { createUserSchema } from '@/lib/validations/schemas';
import { paginationSchema } from '@/lib/validations/schemas';

const userService = new UserService();
const rateLimit = withRateLimit();

export async function GET(request: NextRequest) {
  return withRole(
    request,
    ['admin'],
    async (req, token) => {
      try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        const { users, total } = await userService.getAllUsers(page, limit);

        return NextResponse.json({
          success: true,
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        );
      }
    }
  );
}

export async function POST(request: NextRequest) {
  return withValidation(
    createUserSchema,
    async (req, data) => {
      try {
        const user = await userService.createUser(data);

        return NextResponse.json({
          success: true,
          data: user,
          message: 'User created successfully',
        }, { status: 201 });
      } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }
  );
}
