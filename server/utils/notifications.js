const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email notification (SMTP not configured):', { to, subject });
      return;
    }

    const mailOptions = {
      from: `"MilliporeSigma NPDI" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

const notifyStatusChange = async (ticket, oldStatus, newStatus, changedBy) => {
  const subject = `Ticket ${ticket.ticketNumber} - Status Changed to ${newStatus.replace('_', ' ')}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0066CC; color: white; padding: 20px; text-align: center;">
        <h1>MilliporeSigma NPDI Portal</h1>
      </div>
      
      <div style="padding: 30px;">
        <h2>Ticket Status Update</h2>
        
        <p>The status of ticket <strong>${ticket.ticketNumber}</strong> has been changed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #0066CC; margin: 20px 0;">
          <h3>${ticket.productName}</h3>
          <p><strong>Product Line:</strong> ${ticket.productLine}</p>
          <p><strong>SBU:</strong> ${ticket.sbu}</p>
          <p><strong>Previous Status:</strong> ${oldStatus.replace('_', ' ')}</p>
          <p><strong>New Status:</strong> ${newStatus.replace('_', ' ')}</p>
          <p><strong>Changed By:</strong> ${changedBy.firstName} ${changedBy.lastName}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL}/tickets/${ticket._id}" 
             style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Ticket Details
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from the MilliporeSigma NPDI Portal.
        </p>
      </div>
    </div>
  `;

  const text = `
    Ticket ${ticket.ticketNumber} - Status Changed
    
    Product: ${ticket.productName}
    Previous Status: ${oldStatus.replace('_', ' ')}
    New Status: ${newStatus.replace('_', ' ')}
    Changed By: ${changedBy.firstName} ${changedBy.lastName}
    
    View details: ${process.env.CLIENT_URL}/tickets/${ticket._id}
  `;

  const recipients = [ticket.createdBy?.email].filter(Boolean);
  
  if (ticket.assignedTo?.email && ticket.assignedTo.email !== ticket.createdBy?.email) {
    recipients.push(ticket.assignedTo.email);
  }

  if (recipients.length > 0) {
    await sendEmail({
      to: recipients,
      subject,
      html,
      text
    });
  }
};

const notifyNewTicket = async (ticket) => {
  const subject = `New Product Ticket Created - ${ticket.ticketNumber}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0066CC; color: white; padding: 20px; text-align: center;">
        <h1>MilliporeSigma NPDI Portal</h1>
      </div>
      
      <div style="padding: 30px;">
        <h2>New Product Ticket Created</h2>
        
        <p>A new product development ticket has been created and is awaiting review.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #0066CC; margin: 20px 0;">
          <h3>${ticket.productName}</h3>
          <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Product Line:</strong> ${ticket.productLine}</p>
          <p><strong>SBU:</strong> ${ticket.sbu}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Created By:</strong> ${ticket.createdBy?.firstName} ${ticket.createdBy?.lastName}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL}/tickets/${ticket._id}" 
             style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Review Ticket
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          This notification was sent to PM-OPS team members for ticket assignment and processing.
        </p>
      </div>
    </div>
  `;

  const text = `
    New Product Ticket Created - ${ticket.ticketNumber}
    
    Product: ${ticket.productName}
    Product Line: ${ticket.productLine}
    SBU: ${ticket.sbu}
    Priority: ${ticket.priority}
    Created By: ${ticket.createdBy?.firstName} ${ticket.createdBy?.lastName}
    
    Review ticket: ${process.env.CLIENT_URL}/tickets/${ticket._id}
  `;

  const User = require('../models/User');
  const pmOpsUsers = await User.find({ 
    role: { $in: ['PM_OPS', 'ADMIN'] }, 
    isActive: true 
  }).select('email');
  
  const recipients = pmOpsUsers.map(user => user.email);

  if (recipients.length > 0) {
    await sendEmail({
      to: recipients,
      subject,
      html,
      text
    });
  }
};

const notifyCommentAdded = async (ticket, comment) => {
  const subject = `New Comment on Ticket ${ticket.ticketNumber}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0066CC; color: white; padding: 20px; text-align: center;">
        <h1>MilliporeSigma NPDI Portal</h1>
      </div>
      
      <div style="padding: 30px;">
        <h2>New Comment Added</h2>
        
        <p>A new comment has been added to ticket <strong>${ticket.ticketNumber}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #0066CC; margin: 20px 0;">
          <h3>${ticket.productName}</h3>
          <p><strong>Comment by:</strong> ${comment.user?.firstName} ${comment.user?.lastName}</p>
          <p><strong>Comment:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            ${comment.content}
          </div>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL}/tickets/${ticket._id}" 
             style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Ticket
          </a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from the MilliporeSigma NPDI Portal.
        </p>
      </div>
    </div>
  `;

  const text = `
    New Comment on Ticket ${ticket.ticketNumber}
    
    Product: ${ticket.productName}
    Comment by: ${comment.user?.firstName} ${comment.user?.lastName}
    Comment: ${comment.content}
    
    View ticket: ${process.env.CLIENT_URL}/tickets/${ticket._id}
  `;

  const recipients = [ticket.createdBy?.email].filter(Boolean);
  
  if (ticket.assignedTo?.email && ticket.assignedTo.email !== ticket.createdBy?.email) {
    recipients.push(ticket.assignedTo.email);
  }

  if (comment.user?.email && !recipients.includes(comment.user.email)) {
    recipients.push(comment.user.email);
  }

  if (recipients.length > 0) {
    await sendEmail({
      to: recipients,
      subject,
      html,
      text
    });
  }
};

module.exports = {
  sendEmail,
  notifyStatusChange,
  notifyNewTicket,
  notifyCommentAdded
};