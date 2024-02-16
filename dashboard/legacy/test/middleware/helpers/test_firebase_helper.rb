require_relative '../middleware_test_helper'
require 'datablock_storage'

class DatablockStorageTest < Minitest::Test
  def setup
    CDO.stubs(:firebase_name).returns('firebase-name')
    CDO.stubs(:firebase_secret).returns('firebase-secret')
  end

  def test_delete_channel_with_nil_channel
    e = assert_raises do
      DatablockStorage.delete_channel nil
    end
    assert_equal 'channel_id must be non-empty', e.message
  end

  def test_delete_channel_with_empty_channel
    e = assert_raises do
      DatablockStorage.delete_channel ''
    end
    assert_equal 'channel_id must be non-empty', e.message
  end

  def test_delete_channel_with_fake_channel
    fake_channel_name = 'fake-channel-name'
    fb_client = mock
    fb_client.expects(:delete).with("/v3/channels/#{fake_channel_name}/")
    Firebase::Client.expects(:new).returns(fb_client)
    DatablockStorage.delete_channel fake_channel_name
  end

  def test_delete_channels_with_fake_channels
    fake_channel_names = ['fake-channel-name1', 'fake-channel-name2']
    fb_client = mock
    fb_client.expects(:delete).with("/v3/channels/#{fake_channel_names[0]}/")
    fb_client.expects(:delete).with("/v3/channels/#{fake_channel_names[1]}/")
    Firebase::Client.expects(:new).returns(fb_client)
    DatablockStorage.delete_channels fake_channel_names
  end

  def test_delete_shared_table
    test_response = mock
    test_response.expects(:success?).twice.returns(true)
    fb_client = mock
    fb_client.expects(:delete).times(3).returns(test_response)
    Firebase::Client.expects(:new).returns(fb_client)
    DatablockStorage.delete_shared_table 'fake-table-name'
  end

  def test_upload_shared_table
    fake_table_name = 'fake-table-name'
    test_response = mock
    test_response.expects(:success?).times(3).returns(true)
    fb_client = mock
    fb_client.expects(:delete).with("/v3/channels/shared/metadata/tables/#{fake_table_name}/columns").returns(test_response)
    fb_client.expects(:set).twice.returns(test_response)
    fb_client.expects(:push).twice.returns(test_response)
    Firebase::Client.expects(:new).returns(fb_client)
    DatablockStorage.upload_shared_table(fake_table_name, [{id: 1, name: 'alice'}, {id: 2, name: 'bob'}], ['id', 'name'])
  end
end
