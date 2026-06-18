// src/pages/client/ProposalReviewPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import proposalService from '../../services/proposalService';
import { toast } from 'react-toastify';

export default function ProposalReviewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectDetails, setProjectDetails] = useState(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        console.log('Fetching proposals for project:', projectId);
        
        // Option 1: Get all client proposals and filter
        const res = await proposalService.getClientProposals();
        console.log('All proposals received:', res.data);
        
        // Debug: Check what we're filtering
        const filtered = res.data.filter(p => {
          console.log('Proposal projectId:', p.projectId, 'Looking for:', projectId);
          return p.projectId === projectId || p.project?._id === projectId;
        });
        
        console.log('Filtered proposals:', filtered);
        setProposals(filtered);

        // If we have proposals, get project details from first proposal
        if (filtered.length > 0 && filtered[0].project) {
          setProjectDetails(filtered[0].project);
        }

      } catch (err) {
        console.error('Error fetching proposals:', err);
        toast.error('Failed to load proposals.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, [projectId]);

  const handleAccept = async (id) => {
    try {
      await proposalService.acceptProposal(id);
      toast.success('Proposal accepted successfully!');
      // Refresh list
      setProposals(p => p.map(item => 
        item._id === id ? {...item, status: 'accepted'} : item
      ));
    } catch (err) {
      console.error('Error accepting proposal:', err);
      toast.error('Failed to accept proposal.');
    }
  };

  const handleReject = async (id) => {
    try {
      await proposalService.rejectProposal(id);
      toast.success('Proposal rejected.');
      setProposals(p => p.map(item => 
        item._id === id ? {...item, status: 'rejected'} : item
      ));
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      toast.error('Failed to reject proposal.');
    }
  };

  const handleViewProfile = (proposal) => {
    console.log('View profile clicked for proposal:', proposal);
    
    // Check different possible fields for freelancer ID
    const freelancerId = proposal.freelancerId || proposal.freelancer?._id || proposal.freelancer;
    
    if (freelancerId) {
      console.log('Navigating to freelancer profile with ID:', freelancerId);
      // FIXED: Changed route to match existing route in App.jsx
      navigate(`/profile/${freelancerId}`);
    } else {
      console.warn('No freelancer ID found in proposal:', proposal);
      toast.info('Freelancer profile information is not available.');
    }
  };

  const handleSendMessage = (proposal) => {
    const freelancerId = proposal.freelancerId || proposal.freelancer?._id || proposal.freelancer;
    
    if (freelancerId && projectId) {
      navigate(`/messages?freelancerId=${freelancerId}&projectId=${projectId}`);
    } else {
      toast.info('Unable to start conversation. Required information missing.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">No Proposals Found</h2>
            <p className="text-gray-600 mb-6">
              No proposals have been submitted for this project yet.
            </p>
            <div className="space-x-4">
              <Link 
                to="/client/proposals" 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Back to All Proposals
              </Link>
              <Link 
                to="/client/dashboard" 
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Review Proposals
          </h1>
          {projectDetails && (
            <p className="text-gray-600">
              Project: <span className="font-semibold">{projectDetails.title}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
          </p>
        </div>

        {/* Proposals List */}
        <div className="space-y-6">
          {proposals.map((proposal) => {
            const freelancerId = proposal.freelancerId || proposal.freelancer?._id || proposal.freelancer;
            const freelancerName = proposal.freelancerName || proposal.freelancer?.name || 'Unknown Freelancer';
            const freelancerEmail = proposal.freelancerEmail || proposal.freelancer?.email || 'Email not available';
            
            return (
              <div key={proposal._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                {/* Freelancer Info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {freelancerName}
                    </h3>
                    <p className="text-gray-600">
                      {freelancerEmail}
                    </p>
                    {proposal.freelancer?.skills && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {proposal.freelancer.skills.slice(0, 3).map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {proposal.freelancer.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{proposal.freelancer.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      proposal.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : proposal.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Proposal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[100px]">
                      {proposal.coverLetter || 'No cover letter provided.'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Bid Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bid Amount:</span>
                        <span className="font-semibold text-lg text-green-600">
                          ${proposal.bidAmount || proposal.amount || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Timeline:</span>
                        <span className="font-semibold">
                          {proposal.timeline || proposal.duration || 'Not specified'} days
                        </span>
                      </div>
                      {proposal.estimatedCompletionDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estimated Completion:</span>
                          <span className="font-semibold text-sm">
                            {new Date(proposal.estimatedCompletionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {proposal.attachments && proposal.attachments.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Attachments:</span>
                          <span className="text-blue-600 text-sm">
                            {proposal.attachments.length} file(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Proposal Details */}
                {(proposal.specifics || proposal.milestones || proposal.terms) && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Additional Details</h4>
                    {proposal.specifics && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Specifics:</strong> {proposal.specifics}
                      </p>
                    )}
                    {proposal.milestones && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Milestones:</strong> {proposal.milestones}
                      </p>
                    )}
                    {proposal.terms && (
                      <p className="text-sm text-gray-600">
                        <strong>Terms:</strong> {proposal.terms}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-200 gap-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewProfile(proposal)}
                      disabled={!freelancerId}
                      className={`px-4 py-2 border rounded-lg transition duration-200 ${
                        freelancerId 
                          ? 'border-blue-600 text-blue-600 hover:bg-blue-50' 
                          : 'border-gray-400 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {freelancerId ? 'View Freelancer Profile' : 'Profile Unavailable'}
                    </button>
                    
                    <button
                      onClick={() => handleSendMessage(proposal)}
                      className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition duration-200"
                    >
                      Send Message
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {proposal.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAccept(proposal._id)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                        >
                          Accept Proposal
                        </button>
                        <button
                          onClick={() => handleReject(proposal._id)}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                        >
                          Reject Proposal
                        </button>
                      </>
                    ) : (
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                        proposal.status === 'accepted' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Decision made - {proposal.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
          >
            ← Back
          </button>
          <div className="flex gap-4">
            <Link
              to="/client/proposals"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-center"
            >
              View All Proposals
            </Link>
            <Link
              to="/client/dashboard"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}