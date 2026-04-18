import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// ─────────────────────────────────────────────
// Helpers: đồng bộ localStorage ↔ Redux state
// ─────────────────────────────────────────────
const persistAuth = ({ accessToken, refreshToken, user }) => {
  try {
    if (accessToken)  localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (user)         localStorage.setItem("authUser", JSON.stringify(user));
  } catch (_) {
    // no-op (private browsing / storage full)
  }
};

const clearPersistedAuth = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
  } catch (_) {
    // no-op
  }
};

// ─────────────────────────────────────────────
// Hydrate initial state từ localStorage
// ─────────────────────────────────────────────
const userFromStorage = (() => {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
})();

const initialState = {
  /** user: { _id, name, email, role, profileImageUrl, organization }
   *  organization là ObjectId string → dùng làm organizationId cho RBAC
   */
  user: userFromStorage,
  accessToken:  localStorage.getItem("token")        || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  loading: userFromStorage ? false : true,
  error: null,
};

// ─────────────────────────────────────────────
// Async Thunk: bootstrap user từ token (trang load lại)
// ─────────────────────────────────────────────
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
      return response.data; // { _id, name, email, role, profileImageUrl, organization }
    } catch (error) {
      return rejectWithValue(error?.response?.data || { message: "Unauthorized" });
    }
  }
);

// ─────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * setCredentials: gọi sau khi login / set-password thành công.
     * payload = { accessToken, refreshToken, user }
     * Trong đó user = { _id, name, email, role, profileImageUrl, organization }
     * → role & organizationId (= user.organization) có thể lấy qua selector
     */
    setCredentials(state, action) {
      const { accessToken, refreshToken, user } = action.payload;
      state.user         = user;
      state.accessToken  = accessToken;
      state.refreshToken = refreshToken;
      state.loading      = false;
      state.error        = null;
      persistAuth({ accessToken, refreshToken, user });
    },

    /**
     * setUser: giữ lại để backward-compat với các component cũ
     * nếu chỉ cần cập nhật user (không có token mới).
     */
    setUser(state, action) {
      state.user    = action.payload;
      state.loading = false;
      state.error   = null;
      try {
        localStorage.setItem("authUser", JSON.stringify(action.payload));
      } catch (_) {
        // no-op: private browsing / storage full
      }
    },

    /**
     * updateTokens: axiosInstance gọi sau khi refresh thành công
     * để đồng bộ token mới vào Redux state.
     */
    updateTokens(state, action) {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken  = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
      try {
        localStorage.setItem("token", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      } catch (_) {
        // no-op: private browsing / storage full
      }
    },

    /** clearUser: logout hoàn toàn — xóa state + localStorage */
    clearUser(state) {
      state.user         = null;
      state.accessToken  = null;
      state.refreshToken = null;
      state.loading      = false;
      state.error        = null;
      clearPersistedAuth();
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        // profile endpoint trả về chỉ user object (không có token mới)
        state.user    = action.payload;
        state.loading = false;
        try {
          localStorage.setItem("authUser", JSON.stringify(action.payload));
        } catch (_) {
          // no-op: private browsing / storage full
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.user    = null;
        state.loading = false;
        state.error   = action.payload?.message || "Unauthorized";
        clearPersistedAuth();
      });
  },
});

export const { setCredentials, setUser, updateTokens, clearUser } = authSlice.actions;
export default authSlice.reducer;

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────
/** Lấy role của user hiện tại: "owner" | "admin" | "member" | null */
export const selectRole           = (state) => state.auth.user?.role           ?? null;
/** Lấy organizationId (ObjectId string) của user hiện tại */
export const selectOrganizationId = (state) => state.auth.user?.organization   ?? null;
/** Kiểm tra user có quyền Approve/Reject task không */
export const selectCanApprove     = (state) => ["owner", "admin"].includes(state.auth.user?.role);
