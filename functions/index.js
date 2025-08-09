// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration
// IMPORTANT: Untuk production, use environment variables
const emailConfig = {
    service: 'gmail',
    auth: {
        user: 'noreply.suryaabadi@gmail.com', // Ganti dengan email Anda
        pass: 'your-app-password' // Use App Password, bukan password biasa
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Function: Send email when registration approved
exports.onRegistrationApproval = functions.firestore
.document('registrationRequests/{requestId}')
.onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to approved
    if (before.status === 'pending' && after.status === 'approved') {
        try {
            // Get user data
            const userDoc = await admin.firestore()
            .collection('users')
            .doc(after.userId)
            .get();

            if (userDoc.exists) {
                const userData = userDoc.data();

                // Email content
                const mailOptions = {
                    from: '"Surya Abadi HR" <noreply.suryaabadi@gmail.com>',
                    to: userData.email,
                    subject: '✅ Registration Approved - Surya Abadi Connecteam',
                    html: `
                    <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
                    <div style="background: #00A651; color: white; padding: 20px; text-align: center;">
                    <h1>Welcome to Surya Abadi Connecteam!</h1>
                    </div>
                    <div style="padding: 20px;">
                    <h2>Hello ${userData.name},</h2>
                    <p>Your registration has been <strong style="color: #00A651;">APPROVED</strong>!</p>
                    <p>You can now login using:</p>
                    <ul>
                    <li>Email: ${userData.email}</li>
                    <li>Password: Your registered password</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                    <a href="https://surya-abadi-connecteam.vercel.app/login"
                    style="background: #00A651; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Login Now
                    </a>
                    </div>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                    This is an automated email. Please do not reply.
                    </p>
                    </div>
                    </div>
                    `
                };

                // Send email
                await transporter.sendMail(mailOptions);
                console.log('Approval email sent to:', userData.email);
            }
        } catch (error) {
            console.error('Error sending approval email:', error);
        }
    }

    return null;
});

// Function: Daily reminder at 7:30 AM (optional)
exports.dailyReminder = functions.pubsub
.schedule('30 7 * * 1-5') // Mon-Fri, 7:30 AM
.timeZone('Asia/Jakarta')
.onRun(async (context) => {
    console.log('Daily reminder would run here');
    // Implementation here if needed
    return null;
});

// Function: Alert when someone checks in late
exports.lateCheckInAlert = functions.firestore
.document('attendances/{attendanceId}')
.onCreate(async (snap, context) => {
    const attendance = snap.data();

    if (attendance.status === 'late') {
        console.log('Late check-in detected:', attendance.userName);
        // Send alert email to admin if needed
    }

    return null;
});

// Function: Monthly cleanup for attendance photos
// Runs on the 15th of every month at 02:00 Asia/Jakarta time
exports.cleanupAttendancePhotos = functions.pubsub
  .schedule('0 2 15 * *')
  .timeZone('Asia/Jakarta')
  .onRun(async () => {
    const bucket = admin.storage().bucket();
    const prefix = 'attendances/';

    // Calculate previous month range regardless of 28/30/31 days
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
    const firstDayOfPrevMonth = new Date(
      lastDayOfPrevMonth.getFullYear(),
      lastDayOfPrevMonth.getMonth(),
      1
    );

    console.log('Starting cleanup for attendance photos in range:', {
      from: firstDayOfPrevMonth.toISOString().slice(0, 10),
      to: lastDayOfPrevMonth.toISOString().slice(0, 10),
    });

    try {
      const [files] = await bucket.getFiles({ prefix });
      console.log(`Found ${files.length} files under ${prefix}`);

      const filesToDelete = [];
      const dateRegex = /attendance_[^_]+_(\d{4}-\d{2}-\d{2})_/;

      for (const file of files) {
        const name = file.name; // e.g., attendances/<userId>/attendance_<uid>_YYYY-MM-DD_<ts>.jpg
        const match = name.match(dateRegex);
        if (!match) continue;

        const dateStr = match[1];
        const fileDate = new Date(`${dateStr}T00:00:00Z`);

        if (fileDate >= firstDayOfPrevMonth && fileDate <= lastDayOfPrevMonth) {
          filesToDelete.push(file);
        }
      }

      console.log(`Deleting ${filesToDelete.length} files from previous month`);

      // Delete in parallel with basic throttling
      const concurrency = 10;
      let deleted = 0;

      const chunks = [];
      for (let i = 0; i < filesToDelete.length; i += concurrency) {
        chunks.push(filesToDelete.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (f) => {
            try {
              await f.delete();
              deleted += 1;
            } catch (err) {
              console.error('Failed to delete file:', f.name, err.message);
            }
          })
        );
      }

      console.log(`Cleanup complete. Deleted: ${deleted}`);
    } catch (error) {
      console.error('Cleanup attendance photos failed:', error);
    }

    return null;
  });
