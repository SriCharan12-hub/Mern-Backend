import Feedback from "../Model/FeedBackmodel.js";

// Submit new feedback
export const submitFeedback = async (req, res) => {
  try {
    const { name, email, phone, feedbackType, subject, message, rating } = req.body;

    // Validation
    if (!name || !email || !feedbackType || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }
   
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit phone number'
        });
      }
      const subject1 = req.body.subject.trim();
      if (subject1.length < 5 || subject1.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Subject must be between 5 and 100 characters'
        });
      }
      const messagee = req.body.message.trim();  
      if (messagee.length < 10 || messagee.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message must be between 10 and 1000 characters'
        });
      }

    // Create feedback
    const feedback = new Feedback({
      name,
      email,
      phone,
      feedbackType,
      subject,
      message,
      rating: rating || null,
      userId: req.user ? req.user.id : null
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! We will review it soon.',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback. Please try again.',
      error: error.message
    });
  }
};

// Get all feedback (Admin only OR User's own feedback)
export const getAllFeedback = async (req, res) => {
  try {
    const { 
      status, 
      feedbackType, 
      page = 1, 
      limit = 100, 
      sortBy = 'createdAt', 
      order = 'desc',
      adminView = 'false' // String value from query params
    } = req.query;

    // Build filter
    const filter = {};
    
    // If not admin view, filter by userId (user can only see their own feedbacks)
    if (adminView === 'false' || !adminView) {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      filter.userId = req.user.id;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (feedbackType && feedbackType !== 'all') {
      filter.feedbackType = feedbackType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Get feedback with pagination
    const feedback = await Feedback.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email')
      .lean();

    // Get total count
    const total = await Feedback.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: feedback,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get single feedback by ID (Admin only OR User's own feedback)
export const getFeedbackById = async (req, res) => {
  try {
    const { adminView = 'false' } = req.query;
    
    // Build filter based on admin view or user view
    const filter = { _id: req.params.id };
    if (adminView === 'false' || !adminView) {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      filter.userId = req.user.id; // User can only view their own feedback
    }

    const feedback = await Feedback.findOne(filter)
      .populate('userId', 'username email')
      .lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Update feedback status (Admin only)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update feedback
    const updateData = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'username email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

// Delete feedback (Admin only)
export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};

// Get feedback statistics (Admin only)
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byType: [
            { $group: { _id: '$feedbackType', count: { $sum: 1 } } }
          ],
          averageRating: [
            { 
              $match: { rating: { $exists: true, $ne: null } } 
            },
            { 
              $group: { 
                _id: null, 
                avgRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 }
              } 
            }
          ],
          total: [
            { $count: 'total' }
          ],
          recentFeedback: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails'
              }
            },
            {
              $project: {
                subject: 1,
                feedbackType: 1,
                status: 1,
                rating: 1,
                createdAt: 1,
                'userDetails.username': 1,
                'userDetails.email': 1
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    res.status(200).json({
      success: true,
      data: {
        byStatus: result.byStatus,
        byType: result.byType,
        averageRating: result.averageRating[0] || { avgRating: 0, totalRatings: 0 },
        total: result.total[0]?.total || 0,
        recentFeedback: result.recentFeedback || []
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};