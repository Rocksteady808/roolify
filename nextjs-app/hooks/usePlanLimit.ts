"use client";
import React, { useState, useCallback } from 'react';
import PlanLimitModal from '@/components/PlanLimitModal';

interface PlanLimitResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  planName: string;
  message?: string;
}

interface PlanLimitModalState {
  isOpen: boolean;
  limitType: 'forms' | 'rules' | 'submissions';
  currentCount: number;
  maxLimit: number;
  planName: string;
}

export function usePlanLimit() {
  const [modalState, setModalState] = useState<PlanLimitModalState>({
    isOpen: false,
    limitType: 'rules',
    currentCount: 0,
    maxLimit: 0,
    planName: ''
  });

  const showPlanLimitModal = useCallback((
    limitType: 'forms' | 'rules' | 'submissions',
    currentCount: number,
    maxLimit: number,
    planName: string
  ) => {
    setModalState({
      isOpen: true,
      limitType,
      currentCount,
      maxLimit,
      planName
    });
  }, []);

  const hidePlanLimitModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handlePlanLimitCheck = useCallback(async (
    limitType: 'forms' | 'rules' | 'submissions',
    userId: number = 1
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/plan-limit-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limitType,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check plan limit');
      }

      const result: PlanLimitResult = await response.json();
      
      if (!result.allowed) {
        showPlanLimitModal(
          limitType,
          result.currentCount,
          result.maxLimit,
          result.planName
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking plan limit:', error);
      // On error, allow the action to proceed
      return true;
    }
  }, [showPlanLimitModal]);

  const PlanLimitModalComponent = React.memo(() => {
    return React.createElement(PlanLimitModal, {
      isOpen: modalState.isOpen,
      onClose: hidePlanLimitModal,
      limitType: modalState.limitType,
      currentCount: modalState.currentCount,
      maxLimit: modalState.maxLimit,
      planName: modalState.planName
    });
  });

  return {
    handlePlanLimitCheck,
    showPlanLimitModal,
    hidePlanLimitModal,
    PlanLimitModalComponent
  };
}