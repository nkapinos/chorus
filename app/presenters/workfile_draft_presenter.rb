class WorkfileDraftPresenter < Presenter

  def to_hash
    {
      :content => model.content,
      :id => model.id,
      :owner_id => model.owner_id,
      :workfile_id => model.workfile_id
    }
  end

  def complete_json?
    true
  end
end