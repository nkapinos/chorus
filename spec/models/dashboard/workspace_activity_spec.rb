require 'spec_helper'

describe Dashboard::WorkspaceActivity do
  let(:user) { users(:the_collaborator) }
  let(:model) { described_class.new({:user => user}).fetch! }

  describe '#result' do
    let(:result) { model.result }

    it 'has the correct keys' do
      elem = result.first
      elem.should have_key('event_count')
      elem.should have_key('workspace_id')
      elem.should have_key('date_part')
      elem.should have_key('rank')
    end
  end
end
