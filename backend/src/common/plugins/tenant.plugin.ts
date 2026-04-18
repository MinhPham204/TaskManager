import type { Schema, Query, Document } from 'mongoose';
import { Types } from 'mongoose';
import { tenantStorage } from '../als/tenant-storage';

/**
 * Danh sách Mongoose query hooks cần inject org filter.
 */
const QUERY_HOOKS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'replaceOne',
] as const;

/**
 * Hàm được gắn vào mỗi query hook.
 * Tự động thêm { organization: orgId } vào filter nếu có tenant context.
 */
/**
 * Hàm được gắn vào mỗi query hook.
 * Tự động thêm { organization: orgId } vào filter nếu có tenant context.
 */
function injectOrgFilter(this: Query<unknown, unknown>): void {
  // 🛡️ LỚP BẢO VỆ 1: Kiểm tra xem query có chủ động yêu cầu bỏ qua tenant không
  // Dùng cho trường hợp gọi .setOptions({ skipTenant: true }) ở Service
  if (this.getOptions().skipTenant === true) {
    return; // Thoát ngay, không chèn thêm gì cả!
  }

  // 🛡️ LỚP BẢO VỆ 2: Bỏ qua các Collection cốt lõi không thuộc về Tenant nào cả
  // Tùy tên model bạn định nghĩa trong file Schema (VD: 'Organization', 'User')
  const excludedModels = ['Organization', 'User']; 
  if (this.model && excludedModels.includes(this.model.modelName)) {
    return; // Tổ chức thì không thể thuộc về tổ chức, thoát!
  }

  const orgId = tenantStorage.getStore()?.organizationId;
  if (!orgId) return; // Không có context (ví dụ: JwtStrategy, cron job)

  const filter = this.getFilter() as Record<string, unknown>;
  if (!filter['organization']) {
    this.where({ organization: new Types.ObjectId(orgId) });
  }
}

/**
 * Mongoose Global Plugin — Multi-tenancy "Bức tường ngăn cách".
 *
 * Tự động:
 * 1. Inject { organization: orgId } vào mọi query (find/update/delete/count)
 * 2. Set organization trên document mới trong pre('validate') — TRƯỚC khi
 *    Mongoose chạy required validation, đảm bảo organization: required:true pass.
 *
 * Đăng ký ở connection level qua MongooseModule connectionFactory
 * → áp dụng cho tất cả schemas trong app mà không cần đăng ký riêng.
 *
 * BYPASS: Plugin chỉ kích hoạt khi ALS có organizationId.
 * Các query bên ngoài request scope (seeding, testing) KHÔNG bị ảnh hưởng.
 */
export function tenantPlugin(schema: Schema): void {
  // ─── Query Hooks ────────────────────────────────────────────────────────────
  for (const hook of QUERY_HOOKS) {
    schema.pre(hook, injectOrgFilter);
  }

  // ─── Document Hook (pre validate) ───────────────────────────────────────────
  // Dùng pre('validate') thay vì pre('save') vì Mongoose chạy validation
  // TRƯỚC pre('save'), nên cần set organization trước khi validate.
  schema.pre('validate', async function (this: any) {
    // 1. Kiểm tra nếu là document mới và chưa có organization
    if (this.isNew && !this.organization) {

      // 2. Lấy store từ ALS
      const store = tenantStorage.getStore();

      // Lưu ý: Kiểm tra xem store của bạn là Map hay Object
      // Nếu là Map: store.get('organizationId')
      // Nếu là Object: store.organizationId
      const orgId = store?.organizationId;
      if (orgId) {
        // 3. Gán giá trị (Dùng Types.ObjectId để đảm bảo đúng định dạng MongoDB)
        this.organization = new Types.ObjectId(orgId);
      }
    }
  });
}
