// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { lazy } from 'react';

const ReportBuilderModal = lazy(() => import(/* webpackChunkName: "report-builder-modal" */ '../../../components/ReportBuilderModal'));
const UnassignUserModal = lazy(() => import(/* webpackChunkName: "unassign-user-modal" */ '../../../components/UnassignUserModal'));
const ReplaceCoachModal = lazy(() => import(/* webpackChunkName: "replace-coach-modal" */ '../../../components/ReplaceCoachModal'));
const EditUserModal = lazy(() => import(/* webpackChunkName: "edit-user-modal" */ '../../../components/EditUserModal'));
const PromoteUserModal = lazy(() => import(/* webpackChunkName: "promote-user-modal" */ '../../../components/PromoteUserModal'));
const AssignUserModal = lazy(() => import(/* webpackChunkName: "assign-user-modal" */ '../../../components/AssignUserModal'));

export function PeopleModals({ modals, selectedData, allUsers, coaches, teamRelationships, onClose, onConfirm, actionLoading }) {
  return (
    <>
      {modals.showReportBuilder && (
        <Suspense fallback={<LoadingSpinner />}>
          <ReportBuilderModal isOpen={modals.showReportBuilder} onClose={onClose.reportBuilder} allUsers={allUsers} teamRelationships={teamRelationships} />
        </Suspense>
      )}

      {modals.showUnassignModal && selectedData.teamMember && (
        <Suspense fallback={<LoadingSpinner />}>
          <UnassignUserModal user={selectedData.teamMember.user} coachId={selectedData.teamMember.coachId} coaches={coaches} onClose={onClose.unassign} onConfirm={onConfirm.unassign} />
        </Suspense>
      )}

      {modals.showReplaceCoachModal && selectedData.coachToReplace && (
        <Suspense fallback={<LoadingSpinner />}>
          <ReplaceCoachModal coach={selectedData.coachToReplace} availableReplacements={allUsers.filter(user => user.id !== selectedData.coachToReplace.id)} coaches={coaches} onClose={onClose.replaceCoach} onConfirm={onConfirm.replaceCoach} />
        </Suspense>
      )}

      {modals.showEditModal && selectedData.user && (
        <Suspense fallback={<LoadingSpinner />}>
          <EditUserModal user={selectedData.user} coaches={coaches} onClose={onClose.edit} onSave={onConfirm.saveUser} />
        </Suspense>
      )}

      {modals.showPromoteModal && selectedData.user && (
        <Suspense fallback={<LoadingSpinner />}>
          <PromoteUserModal user={selectedData.user} onClose={onClose.promote} onConfirm={onConfirm.promote} />
        </Suspense>
      )}

      {modals.showAssignModal && selectedData.user && (
        <Suspense fallback={<LoadingSpinner />}>
          <AssignUserModal user={selectedData.user} coaches={coaches} onClose={onClose.assign} onConfirm={onConfirm.assign} />
        </Suspense>
      )}

      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </>
  );
}

PeopleModals.propTypes = {
  modals: PropTypes.shape({
    showReportBuilder: PropTypes.bool.isRequired,
    showUnassignModal: PropTypes.bool.isRequired,
    showReplaceCoachModal: PropTypes.bool.isRequired,
    showEditModal: PropTypes.bool.isRequired,
    showPromoteModal: PropTypes.bool.isRequired,
    showAssignModal: PropTypes.bool.isRequired
  }).isRequired,
  selectedData: PropTypes.shape({
    user: PropTypes.object,
    teamMember: PropTypes.object,
    coachToReplace: PropTypes.object
  }).isRequired,
  allUsers: PropTypes.array.isRequired,
  coaches: PropTypes.array.isRequired,
  teamRelationships: PropTypes.array.isRequired,
  onClose: PropTypes.object.isRequired,
  onConfirm: PropTypes.object.isRequired,
  actionLoading: PropTypes.bool.isRequired
};

export default PeopleModals;
