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
const message_routes_1 = __importDefault(require("./app/routes/message.routes"));
const notification_routes_1 = __importDefault(require("./app/routes/notification.routes"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_controller_1 = require("./app/socket/socket.controller");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
// Initialize Socket Logic
(0, socket_controller_1.initializeSocket)(io);
// Middleware
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from public/uploads directory
// Serve static files from public/uploads directory
const uploadsPath = path_1.default.join(process.cwd(), 'public', 'uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express_1.default.static(uploadsPath));
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
app.use('/api/messages', message_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/upload', upload_routes_1.default);
// Global Error Handler
app.all('*', (req, _res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(error_middleware_1.globalErrorHandler);
server.listen(Number(env_1.env.PORT), () => {
    console.log(`🚀 Backend running on http://localhost:${env_1.env.PORT}`);
});
