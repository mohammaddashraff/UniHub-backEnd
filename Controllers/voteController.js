const { upVoteService, downVoteService, getVoteCountsService, removeVoteService } = require('../Services/voteService');

const upVote = (req, res) => {
    const { postId } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    upVoteService(postId, token, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({ error: err.message });
        }
        res.status(result.status || 200).json({ message: result.message });
    });
};

const downVote = (req, res) => {
    const { postId } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    downVoteService(postId, token, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({ error: err.message });
        }
        res.status(result.status || 200).json({ message: result.message });
    });
};

const getVoteCounts = (req, res) => {
    const { postId } = req.params;

    getVoteCountsService(postId, (err, result) => {
        if (err) {
            res.status(err.status || 500).json({ message: err.message });
        } else {
            res.status(result.status).json({ upvoteCount: result.upvoteCount, downvoteCount: result.downvoteCount });
        }
    });
};

const removeVote = (req, res) => {
    const { postId } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    removeVoteService(postId, token, (err, result) => {
        if (err) {
            res.status(err.status || 500).json({ message: err.message });
        } else {
            res.status(result.status).json({ message: result.message });
        }
    });
};

module.exports = {
    upVote,
    downVote,
    getVoteCounts,
    removeVote
};
