import React from 'react';
import {expect} from '../../../util/reconfiguredChai';
import {shallow} from 'enzyme';
import AiAssessment from '@cdo/apps/templates/rubrics/AiAssessment';

describe('AiAssessment', () => {
  const mockAiInfo = {
    id: 2,
    learning_goal_id: 2,
    understanding: 2,
    ai_confidence: 2,
  };
  const props = {
    isAiAssessed: true,
    studentName: 'Jane Doe',
    aiUnderstandingLevel: 3,
    aiConfidence: 70,
    learningGoalKey: 'learning_goal',
    aiEvalInfo: mockAiInfo,
  };

  it('renders AiAssessmentBox if it is assessessed by AI', () => {
    const wrapper = shallow(<AiAssessment {...props} />);
    expect(wrapper.find('AiAssessmentBox')).to.have.lengthOf(1);
    expect(wrapper.find('AiAssessmentBox').props().isAiAssessed).to.equal(
      props.isAiAssessed
    );
    expect(wrapper.find('AiAssessmentBox').props().studentName).to.equal(
      props.studentName
    );
    expect(
      wrapper.find('AiAssessmentBox').props().aiUnderstandingLevel
    ).to.equal(props.aiUnderstandingLevel);
    expect(wrapper.find('AiAssessmentBox').props().aiConfidence).to.equal(
      props.aiConfidence
    );
  });

  it('render AIAssessmentFeedback element', () => {
    const wrapper = shallow(<AiAssessment {...props} />);
    expect(wrapper.find('AiAssessmentFeedback')).to.have.lengthOf(1);
    expect(wrapper.find('AiAssessmentFeedback').props().aiEvalInfo).to.equal(
      props.aiEvalInfo
    );
  });
});
