import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../user/schemas/user.schema';

/**
 * @GetUser() - lấy user hiện tại từ request object (được gắn bởi JwtStrategy).
**/

export const GetUser = createParamDecorator(
  (field: keyof UserDocument | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserDocument;
    return field ? user?.[field] : user;
  },
);
