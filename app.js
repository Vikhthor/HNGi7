require('dotenv').config();
require('./config/database').connect();
require('./services/mqConsumerService').consume();
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const { API_PORT } = process.env;

const app = express();

const { SENTRY_DSN } = process.env;
Sentry.init({
  dsn: SENTRY_DSN,
  attachStacktrace: true,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({
      // to trace all requests to the default router
      app,
    }),
  ],
  tracesSampleRate: 1.0,
});

const cors = require('cors');

require('./services/superAdminService')();

const documentation = require('./routes/documentation');
const google = require('./routes/google');
const facebook = require('./routes/facebook');
const customer = require('./routes/customer');
const otp = require('./routes/otp');
const transactions = require('./routes/transaction');
const store = require('./routes/stores.js');
const register = require('./routes/register_route');
const login = require('./routes/login_route');
const emailAPI = require('./routes/email');
const complaintRouter = require('./routes/complaint');
const docs = require('./routes/docs');
const user = require('./routes/user');
const reset = require('./routes/reset');
const activity = require('./routes/activity');
const debt = require('./routes/debt_reminder');
const businessCards = require('./routes/businessCardRoute');
const account = require('./routes/account.verify');
const dashboard = require('./routes/dashboard');
const messaging = require('./routes/messaging');
const payment = require('./routes/payment');
const imageUpdate = require('./routes/profileImage');
const customerGroups = require('./routes/customer_group');
const notifications = require('./routes/notifications');
const googleRedirect = require('./routes/google_redirect');
const template = require('./routes/template');
const paymentSchedule = require('./routes/paymentSchedule');
const reminder = require('./routes/reminders');

// The sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.set('view engine', 'ejs');

// Redirect to docs on get to root
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// middleware to enable us to send otp and a success message at the same time without errors
app.use((req, res, next) => {
  const _send = res.send;
  let sent = false;
  res.send = function (data) {
    if (sent) return;
    _send.bind(res)(data);
    sent = true;
  };
  next();
});
app.use(documentation);
app.use('/customer', customer);
app.use(otp);
app.use(reset);
app.use('/email', emailAPI);
app.use(transactions);
app.use(activity);
app.use(businessCards);
app.use(store);
app.use(google);
app.use(facebook);
app.use(complaintRouter);
app.use(user);
app.use(docs);
app.use(account);
app.use(dashboard);
app.use(messaging);
app.use(payment);
app.use('/register', register);
app.use('/login', login);
app.use(debt);
app.use(imageUpdate);
app.use(customerGroups);
app.use('/notifications', notifications);
app.use(googleRedirect);
app.use(template);
app.use('/schedule', paymentSchedule);
app.use(reminder);

// The sentry error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// This should be the last route else any after it won't work
app.use('*', (req, res) => {
  res.status(404).json({
    success: 'false',
    message: 'Page not found',
    error: {
      statusCode: 404,
      message: 'You reached a route that is not defined on this server',
    },
  });
});

const port = process.env.PORT || API_PORT;
app.listen(port, () => {
  console.log(`app running on port: ${port}`);
});
