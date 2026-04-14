import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import GoogleReviewPrompt from './GoogleReviewPrompt';
import { GOOGLE_REVIEW_PLACE_URL } from '../lib/api';
import { useOrderEvents } from '../context/OrderEventsContext';

export default function PostOrderFeedbackLayer() {
  const navigate = useNavigate();
  const { postCheckoutFeedbackOrderId, clearPostCheckoutFeedback, applyKdsOrderCompleted } =
    useCart();
  const { authFetch } = useAuth();
  const { subscribe } = useOrderEvents();

  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(GOOGLE_REVIEW_PLACE_URL);
  const applyKdsRef = useRef(applyKdsOrderCompleted);
  applyKdsRef.current = applyKdsOrderCompleted;

  const dismissAllAndHome = useCallback(() => {
    clearPostCheckoutFeedback();
    setGoogleOpen(false);
    navigate('/', { replace: true });
  }, [clearPostCheckoutFeedback, navigate]);

  const handleCloseFeedback = useCallback(() => {
    clearPostCheckoutFeedback();
    navigate('/', { replace: true });
  }, [clearPostCheckoutFeedback, navigate]);

  const handleFeedbackComplete = useCallback(
    ({ googleReviewUrl }) => {
      clearPostCheckoutFeedback();
      setGoogleUrl(googleReviewUrl || GOOGLE_REVIEW_PLACE_URL);
      setGoogleOpen(true);
    },
    [clearPostCheckoutFeedback]
  );

  const handleLeaveReview = useCallback(() => {
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
    dismissAllAndHome();
  }, [dismissAllAndHome, googleUrl]);

  const handleMaybeLater = useCallback(() => {
    dismissAllAndHome();
  }, [dismissAllAndHome]);

  const prevFeedbackId = useRef(null);
  useEffect(() => {
    if (
      postCheckoutFeedbackOrderId != null &&
      postCheckoutFeedbackOrderId !== prevFeedbackId.current
    ) {
      setGoogleOpen(false);
    }
    prevFeedbackId.current = postCheckoutFeedbackOrderId;
  }, [postCheckoutFeedbackOrderId]);

  useEffect(() => {
    const onCompleted = (payload) => {
      applyKdsRef.current?.(payload);
    };

    return subscribe('customerOrderCompleted', onCompleted);
  }, [subscribe]);

  const feedbackOpen = postCheckoutFeedbackOrderId != null;

  return (
    <>
      <FeedbackModal
        isOpen={feedbackOpen}
        orderId={postCheckoutFeedbackOrderId ?? ''}
        fetchImpl={authFetch}
        onClose={handleCloseFeedback}
        onComplete={handleFeedbackComplete}
      />
      <GoogleReviewPrompt
        isOpen={googleOpen}
        onLeaveReview={handleLeaveReview}
        onMaybeLater={handleMaybeLater}
      />
    </>
  );
}
