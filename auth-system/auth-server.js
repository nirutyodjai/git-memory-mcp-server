/**
 * NEXUS IDE Authentication & Authorization Server
 * Handles user authentication, authorization, and session management
 * Supports multiple authentication methods and role-based access control
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class NEXUSAuthServer {
    constructor() {
        this.app = express();
        this.port = process.env.AUTH_PORT || 3001;
        this.jwtSecret = process.env.JWT_SECRET || 'nexus-ide-super-secret-key';
        this.mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/nexus-ide';
        
        this.setupMiddleware();
        this.setupDatabase();
        this.setupPassport();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));

        // Rate limiting
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 requests per windowMs
            message: 'Too many authentication attempts, please try again later'
        });

        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });

        this.app.use('/auth/login', authLimiter);
        this.app.use('/auth/register', authLimiter);
        this.app.use(generalLimiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Session management
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'nexus-session-secret',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                mongoUrl: this.mongoUrl
            }),
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        this.app.use(passport.initialize());
        this.app.use(passport.session());
    }

    async setupDatabase() {
        try {
            await mongoose.connect(this.mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }

    setupPassport() {
        // Local Strategy
        passport.use(new LocalStrategy({
            usernameField: 'email'
        }, async (email, password, done) => {
            try {
                const user = await User.findOne({ email }).select('+password');
                if (!user) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return done(null, false, { message: 'Invalid credentials' });
                }

                if (!user.isEmailVerified) {
                    return done(null, false, { message: 'Please verify your email first' });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));

        // Google OAuth Strategy
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                
                if (user) {
                    return done(null, user);
                }

                // Check if user exists with same email
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.googleId = profile.id;
                    user.isEmailVerified = true;
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                user = new User({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    avatar: profile.photos[0].value,
                    isEmailVerified: true,
                    authProvider: 'google',
                    subscription: {
                        tier: 'free',
                        status: 'active'
                    }
                });

                await user.save();
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));

        // GitHub OAuth Strategy
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: '/auth/github/callback'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ githubId: profile.id });
                
                if (user) {
                    return done(null, user);
                }

                // Check if user exists with same email
                const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                if (email) {
                    user = await User.findOne({ email });
                    if (user) {
                        user.githubId = profile.id;
                        user.isEmailVerified = true;
                        await user.save();
                        return done(null, user);
                    }
                }

                // Create new user
                user = new User({
                    githubId: profile.id,
                    email: email,
                    name: profile.displayName || profile.username,
                    username: profile.username,
                    avatar: profile.photos[0].value,
                    isEmailVerified: !!email,
                    authProvider: 'github',
                    subscription: {
                        tier: 'free',
                        status: 'active'
                    }
                });

                await user.save();
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));

        passport.serializeUser((user, done) => {
            done(null, user._id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findById(id);
                done(null, user);
            } catch (error) {
                done(error);
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        // Register
        this.app.post('/auth/register', [
            body('email').isEmail().normalizeEmail(),
            body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
            body('name').isLength({ min: 2 }).trim().escape()
        ], async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const { email, password, name } = req.body;

                // Check if user already exists
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' });
                }

                // Hash password
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create user
                const user = new User({
                    email,
                    password: hashedPassword,
                    name,
                    authProvider: 'local',
                    subscription: {
                        tier: 'free',
                        status: 'active'
                    }
                });

                await user.save();

                // Send verification email
                await this.sendVerificationEmail(user);

                res.status(201).json({
                    message: 'User created successfully. Please check your email for verification.',
                    userId: user._id
                });
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // Login
        this.app.post('/auth/login', [
            body('email').isEmail().normalizeEmail(),
            body('password').notEmpty()
        ], (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            passport.authenticate('local', async (err, user, info) => {
                if (err) {
                    return res.status(500).json({ message: 'Internal server error' });
                }

                if (!user) {
                    return res.status(401).json({ message: info.message });
                }

                // Check 2FA if enabled
                if (user.twoFactorEnabled) {
                    const { twoFactorCode } = req.body;
                    if (!twoFactorCode) {
                        return res.status(200).json({ 
                            requiresTwoFactor: true,
                            userId: user._id 
                        });
                    }

                    const verified = speakeasy.totp.verify({
                        secret: user.twoFactorSecret,
                        encoding: 'base32',
                        token: twoFactorCode,
                        window: 2
                    });

                    if (!verified) {
                        return res.status(401).json({ message: 'Invalid 2FA code' });
                    }
                }

                // Generate JWT
                const token = this.generateJWT(user);
                const refreshToken = this.generateRefreshToken(user);

                // Update last login
                user.lastLogin = new Date();
                await user.save();

                res.json({
                    message: 'Login successful',
                    token,
                    refreshToken,
                    user: {
                        id: user._id,
                        email: user.email,
                        name: user.name,
                        avatar: user.avatar,
                        subscription: user.subscription,
                        permissions: user.permissions
                    }
                });
            })(req, res, next);
        });

        // OAuth routes
        this.app.get('/auth/google', passport.authenticate('google', {
            scope: ['profile', 'email']
        }));

        this.app.get('/auth/google/callback', 
            passport.authenticate('google', { failureRedirect: '/login' }),
            async (req, res) => {
                const token = this.generateJWT(req.user);
                const refreshToken = this.generateRefreshToken(req.user);
                
                res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
            }
        );

        this.app.get('/auth/github', passport.authenticate('github', {
            scope: ['user:email']
        }));

        this.app.get('/auth/github/callback',
            passport.authenticate('github', { failureRedirect: '/login' }),
            async (req, res) => {
                const token = this.generateJWT(req.user);
                const refreshToken = this.generateRefreshToken(req.user);
                
                res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
            }
        );

        // Token refresh
        this.app.post('/auth/refresh', async (req, res) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return res.status(401).json({ message: 'Refresh token required' });
                }

                const decoded = jwt.verify(refreshToken, this.jwtSecret + 'refresh');
                const user = await User.findById(decoded.userId);
                
                if (!user) {
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }

                const newToken = this.generateJWT(user);
                const newRefreshToken = this.generateRefreshToken(user);

                res.json({ token: newToken, refreshToken: newRefreshToken });
            } catch (error) {
                res.status(401).json({ message: 'Invalid refresh token' });
            }
        });

        // Logout
        this.app.post('/auth/logout', this.authenticateToken, (req, res) => {
            req.logout((err) => {
                if (err) {
                    return res.status(500).json({ message: 'Logout failed' });
                }
                res.json({ message: 'Logged out successfully' });
            });
        });

        // Email verification
        this.app.get('/auth/verify/:token', async (req, res) => {
            try {
                const { token } = req.params;
                const user = await User.findOne({ emailVerificationToken: token });
                
                if (!user) {
                    return res.status(400).json({ message: 'Invalid verification token' });
                }

                user.isEmailVerified = true;
                user.emailVerificationToken = undefined;
                await user.save();

                res.json({ message: 'Email verified successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Verification failed' });
            }
        });

        // 2FA setup
        this.app.post('/auth/2fa/setup', this.authenticateToken, async (req, res) => {
            try {
                const user = await User.findById(req.user.userId);
                
                const secret = speakeasy.generateSecret({
                    name: `NEXUS IDE (${user.email})`,
                    issuer: 'NEXUS IDE'
                });

                const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

                user.twoFactorSecret = secret.base32;
                await user.save();

                res.json({
                    secret: secret.base32,
                    qrCode: qrCodeUrl
                });
            } catch (error) {
                res.status(500).json({ message: 'Failed to setup 2FA' });
            }
        });

        // 2FA verify
        this.app.post('/auth/2fa/verify', this.authenticateToken, async (req, res) => {
            try {
                const { token } = req.body;
                const user = await User.findById(req.user.userId);

                const verified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token,
                    window: 2
                });

                if (verified) {
                    user.twoFactorEnabled = true;
                    await user.save();
                    res.json({ message: '2FA enabled successfully' });
                } else {
                    res.status(400).json({ message: 'Invalid 2FA code' });
                }
            } catch (error) {
                res.status(500).json({ message: 'Failed to verify 2FA' });
            }
        });

        // User profile
        this.app.get('/auth/profile', this.authenticateToken, async (req, res) => {
            try {
                const user = await User.findById(req.user.userId).select('-password -twoFactorSecret');
                res.json(user);
            } catch (error) {
                res.status(500).json({ message: 'Failed to fetch profile' });
            }
        });

        // Update profile
        this.app.put('/auth/profile', this.authenticateToken, [
            body('name').optional().isLength({ min: 2 }).trim().escape(),
            body('email').optional().isEmail().normalizeEmail()
        ], async (req, res) => {
            try {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }

                const user = await User.findById(req.user.userId);
                const { name, email } = req.body;

                if (name) user.name = name;
                if (email && email !== user.email) {
                    // Check if email is already taken
                    const existingUser = await User.findOne({ email });
                    if (existingUser) {
                        return res.status(400).json({ message: 'Email already taken' });
                    }
                    user.email = email;
                    user.isEmailVerified = false;
                    await this.sendVerificationEmail(user);
                }

                await user.save();
                res.json({ message: 'Profile updated successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Failed to update profile' });
            }
        });
    }

    // Middleware to authenticate JWT token
    authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }

        jwt.verify(token, this.jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    };

    // Generate JWT token
    generateJWT(user) {
        return jwt.sign(
            {
                userId: user._id,
                email: user.email,
                subscription: user.subscription,
                permissions: user.permissions
            },
            this.jwtSecret,
            { expiresIn: '1h' }
        );
    }

    // Generate refresh token
    generateRefreshToken(user) {
        return jwt.sign(
            { userId: user._id },
            this.jwtSecret + 'refresh',
            { expiresIn: '7d' }
        );
    }

    // Send verification email
    async sendVerificationEmail(user) {
        const token = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = token;
        await user.save();

        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
        
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Verify your NEXUS IDE account',
            html: `
                <h1>Welcome to NEXUS IDE!</h1>
                <p>Please click the link below to verify your email address:</p>
                <a href="${verificationUrl}">Verify Email</a>
                <p>If you didn't create this account, please ignore this email.</p>
            `
        });
    }

    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ message: 'Internal server error' });
        });
    }

    async start() {
        try {
            this.server = this.app.listen(this.port, () => {
                console.log(`🔐 NEXUS IDE Auth Server running on port ${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/health`);
            });
        } catch (error) {
            console.error('❌ Failed to start auth server:', error);
            process.exit(1);
        }
    }

    async stop() {
        if (this.server) {
            this.server.close();
            await mongoose.connection.close();
            console.log('🔐 Auth server stopped');
        }
    }
}

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    
    // OAuth IDs
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    
    // Authentication
    authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    
    // 2FA
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    
    // Subscription
    subscription: {
        tier: { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
        status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String }
    },
    
    // Permissions
    permissions: [{
        resource: String,
        actions: [String]
    }],
    
    // Usage tracking
    usage: {
        aiRequests: { type: Number, default: 0 },
        storageUsed: { type: Number, default: 0 },
        collaborators: { type: Number, default: 0 },
        projects: { type: Number, default: 0 }
    },
    
    // Metadata
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const User = mongoose.model('User', userSchema);

// Export
module.exports = { NEXUSAuthServer, User };

// Start server if run directly
if (require.main === module) {
    const authServer = new NEXUSAuthServer();
    authServer.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => authServer.stop());
    process.on('SIGINT', () => authServer.stop());
}