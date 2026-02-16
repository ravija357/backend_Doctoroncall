"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const AppError_1 = require("./app/utils/AppError");
const error_middleware_1 = require("./app/middlewares/error.middleware");
const upload_routes_1 = __importDefault(require("./app/routes/upload.routes"));
const auth_routes_1 = __importDefault(require("./app/routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./app/routes/admin.routes"));
const doctor_routes_1 = __importDefault(require("./app/routes/doctor.routes"));
const availability_routes_1 = __importDefault(require("./app/routes/availability.routes"));
const appointment_routes_1 = __importDefault(require("./app/routes/appointment.routes"));
const review_routes_1 = __importDefault(require("./app/routes/review.routes"));
const medical_history_routes_1 = __importDefault(require("./app/routes/medical-history.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Database Connection
(0, db_1.connectDB)();
// Routes
app.get('/health', (_req, res) => {
    res.json({
        status: 'Doctor Booking System Backend API Ready ✅',
        env: env_1.env.NODE_ENV,
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/availability', availability_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/medical-history', medical_history_routes_1.default);
app.use('/upload', upload_routes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Global Error Handler
app.all('*', (req, _res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(error_middleware_1.globalErrorHandler);
app.listen(Number(env_1.env.PORT), () => {
    console.log(`🚀 Backend running on http://localhost:${env_1.env.PORT}`);
});
