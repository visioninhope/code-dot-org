import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import ProgressLessonContent from './ProgressLessonContent';
import FontAwesome from '../FontAwesome';
import color from '@cdo/apps/util/color';
import {lessonType, studentLevelProgressType} from './progressTypes';
import {ViewType} from '@cdo/apps/code-studio/viewAsRedux';
import i18n from '@cdo/locale';
import {
  lessonIsVisible,
  lessonIsLockedForAllStudents,
  stageLocked
} from './progressHelpers';
import ProgressLessonTeacherInfo from './ProgressLessonTeacherInfo';
import FocusAreaIndicator from './FocusAreaIndicator';
import ReactTooltip from 'react-tooltip';
import _ from 'lodash';

const styles = {
  outer: {
    position: 'relative',
    display: 'table',
    width: '100%',
    height: '100%',
    background: color.lightest_gray,
    borderColor: color.border_gray,
    borderStyle: 'solid',
    borderRadius: 2,
    // When toggling between hidden and not, we change our border size from 1 to 4.
    // We want to limit how much toggling this changes our sizing, so we add +3
    // to each of our non-hidden margins
    borderWidth: 1,
    marginTop: 3,
    marginBottom: 15,
    marginLeft: 3,
    marginRight: 3
  },
  main: {
    padding: 20
  },
  heading: {
    fontSize: 18,
    fontFamily: '"Gotham 5r", sans-serif',
    cursor: 'pointer'
  },
  hiddenOrLocked: {
    borderStyle: 'dashed',
    borderWidth: 4,
    marginTop: 0,
    marginBottom: 12,
    marginLeft: 0,
    marginRight: 0
  },
  translucent: {
    opacity: 0.6
  },
  caret: {
    marginRight: 10
  },
  icon: {
    marginRight: 5,
    fontSize: 18,
    color: color.cyan
  },
  unlockedIcon: {
    color: color.orange
  }
};

class ProgressLesson extends React.Component {
  static propTypes = {
    lesson: lessonType.isRequired,

    // redux provided
    studentProgress: PropTypes.objectOf(studentLevelProgressType),
    currentStageId: PropTypes.number,
    showTeacherInfo: PropTypes.bool.isRequired,
    viewAs: PropTypes.oneOf(Object.values(ViewType)).isRequired,
    showLockIcon: PropTypes.bool.isRequired,
    lessonIsVisible: PropTypes.func.isRequired,
    lessonLockedForSection: PropTypes.func.isRequired,
    selectedSectionId: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      // We want teachers to start with everything uncollapsed. For students we
      // collapse everything except current stage
      collapsed:
        props.viewAs !== ViewType.Teacher &&
        props.currentStageId !== props.lesson.id
    };
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // If we're assigned a stageId, and it is for this lesson, uncollapse
    if (nextProps.currentStageId !== this.props.currentStageId) {
      this.setState({
        collapsed:
          this.state.collapsed &&
          nextProps.currentStageId !== this.props.lesson.id
      });
    }
  }

  toggleCollapsed() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  render() {
    const {
      lesson,
      studentProgress,
      showTeacherInfo,
      viewAs,
      showLockIcon,
      lessonIsVisible,
      lessonLockedForSection,
      selectedSectionId
    } = this.props;

    if (!lessonIsVisible(lesson, viewAs)) {
      return null;
    }

    // Is this a hidden stage that we still render because we're a teacher
    const hiddenForStudents = !lessonIsVisible(lesson, ViewType.Student);
    const title = lesson.stageNumber
      ? i18n.lessonNumbered({
          lessonNumber: lesson.stageNumber,
          lessonName: lesson.name
        })
      : lesson.name;
    const caret = this.state.collapsed ? 'caret-right' : 'caret-down';

    // Treat the stage as locked if either
    // (a) it is locked for this user (in the case of a student)
    // (b) it is locked for all students in the section (in the case of a teacher)
    const locked =
      lesson.lockable &&
      (stageLocked(lesson.levels, studentProgress) ||
        lessonLockedForSection(lesson.id));

    const hiddenOrLocked = hiddenForStudents || locked;
    const tooltipId = _.uniqueId();

    const description =
      viewAs === ViewType.Teacher
        ? lesson.description_teacher
        : lesson.description_student;

    // There's no url for a lesson so use the url of the first level of the lesson
    // as the url for the lesson.
    // TODO: Make the back-end return a lesson url as part of the lesson metadata so we
    // don't need to pass it separately from lesson here and in ProgressLessonTeacherInfo.
    const lessonUrl = lesson.levels[0] && lesson.levels[0].url;
    return (
      <div
        style={{
          ...styles.outer,
          ...(hiddenOrLocked && styles.hiddenOrLocked)
        }}
      >
        <div
          style={{
            ...styles.main,
            ...(hiddenOrLocked &&
              viewAs !== ViewType.Teacher &&
              styles.translucent)
          }}
        >
          <div style={styles.heading} onClick={this.toggleCollapsed}>
            <FontAwesome icon={caret} style={styles.caret} />
            {hiddenForStudents && (
              <FontAwesome icon="eye-slash" style={styles.icon} />
            )}
            {showLockIcon && lesson.lockable && locked && (
              <FontAwesome icon="lock" style={styles.icon} />
            )}
            {showLockIcon && lesson.lockable && !locked && (
              <span data-tip data-for={tooltipId}>
                <FontAwesome
                  icon="unlock"
                  style={{
                    ...styles.icon,
                    ...styles.unlockedIcon
                  }}
                />
                {viewAs === ViewType.Teacher && (
                  <ReactTooltip
                    id={tooltipId}
                    role="tooltip"
                    wrapper="span"
                    effect="solid"
                  >
                    {i18n.lockAssessmentLong()}
                  </ReactTooltip>
                )}
              </span>
            )}
            <span>{title}</span>
          </div>
          {!this.state.collapsed && (
            <ProgressLessonContent
              description={description}
              levels={lesson.levels}
              disabled={locked && viewAs !== ViewType.Teacher}
              selectedSectionId={selectedSectionId}
            />
          )}
        </div>
        {showTeacherInfo && viewAs === ViewType.Teacher && (
          <ProgressLessonTeacherInfo lesson={lesson} lessonUrl={lessonUrl} />
        )}
        {lesson.isFocusArea && <FocusAreaIndicator />}
      </div>
    );
  }
}

export const UnconnectedProgressLesson = ProgressLesson;

export default connect(state => ({
  currentStageId: state.progress.currentStageId,
  showTeacherInfo: state.progress.showTeacherInfo,
  viewAs: state.viewAs,
  showLockIcon:
    !!state.teacherSections.selectedSectionId ||
    state.viewAs === ViewType.Student,
  lessonLockedForSection: lessonId =>
    lessonIsLockedForAllStudents(lessonId, state),
  lessonIsVisible: (lesson, viewAs) => lessonIsVisible(lesson, state, viewAs),
  selectedSectionId: state.teacherSections.selectedSectionId,
  studentProgress: state.progress.progressByLevel
}))(ProgressLesson);
