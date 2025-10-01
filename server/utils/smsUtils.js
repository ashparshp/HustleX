const sendSMS = async (to, message) => {
  try {

    console.log(`SMS sent to ${to}: ${message}`);


    return {
      success: true,
      messageId: `dev-${Date.now()}`
    };
  } catch (error) {
    console.error("SMS sending error:", error);
    throw new Error("Failed to send SMS");
  }
};


const sendVerificationSMS = async (phoneNumber, code) => {
  const message = `Your verification code is: ${code}. It will expire in 10 minutes.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendVerificationSMS
};