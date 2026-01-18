import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Delete,
  Visibility,
  VisibilityOff,
  FilterList,
  Add,
  Block,
  Comment as CommentIcon,
  Image as ImageIcon,
  Info,
} from '@mui/icons-material';
import {
  getPosts,
  getComments,
  getBannedWords,
  getMedia,
  updatePostVisibility,
  updateCommentVisibility,
  deletePost,
  deleteComment,
  deleteBannedWord,
  addBannedWord,
  deleteMedia,
} from '../../api-axios/admin';

const AdminContentPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [bannedWords, setBannedWords] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openWordDialog, setOpenWordDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newWord, setNewWord] = useState('');
  const [wordCategory, setWordCategory] = useState('spam');

  useEffect(() => {
    loadContentData();
  }, [page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
    loadContentData();
  }, [tabValue]);

  const loadContentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage
      };
      
      switch (tabValue) {
        case 0:
          const postsRes = await getPosts(params);
          console.log("Posts response:", postsRes.data);
          setPosts(postsRes.data.data || []);
          setTotalCount(postsRes.data.pagination?.total || 0);
          break;
        case 1:
          const commentsRes = await getComments(params);
          console.log("Comments response:", commentsRes.data);
          setComments(commentsRes.data.data || []);
          setTotalCount(commentsRes.data.pagination?.total || 0);
          break;
        case 2:
          const wordsRes = await getBannedWords();
          setBannedWords(wordsRes.data.data || []);
          setTotalCount(wordsRes.data.pagination?.total || wordsRes.data.data?.length || 0);
          break;
        case 3:
          const mediaRes = await getMedia(params);
          setMedia(mediaRes.data.data || []);
          setTotalCount(mediaRes.data.pagination?.total || 0);
          break;
      }
    } catch (err) {
      console.error("Load content error:", err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewContent = (item) => {
    setSelectedItem(item);
    setOpenViewDialog(true);
  };

  const handleToggleVisibility = async (id, type) => {

    console.log("Toggling visibility for ", type, " with id ", id);
    try {
      if (type === 'post') {
        const post = posts.find(p => (p._id || p.id) === id);
        const newVisibility = post.visibility === 'published' ? 'hidden' : 'published';

        await updatePostVisibility(id, newVisibility);

        setPosts(posts.map(post =>
          (post._id || post.id) === id
            ? { ...post, visibility: newVisibility }
            : post
        ));

        setSnackbar({
          open: true,
          message: `Đã ${newVisibility === 'published' ? 'hiện' : 'ẩn'} bài viết thành công`,
          severity: 'success'
        });
      } else {
        const comment = comments.find(c => (c._id || c.id) === id);
        const newStatus = comment.visibility === 'published' ? 'hidden' : 'published';

        await updateCommentVisibility(id, newStatus);

        setComments(comments.map(comment =>
          (comment._id || comment.id) === id
            ? { ...comment, visibility: newStatus }
            : comment
        ));

        setSnackbar({
          open: true,
          message: `Đã ${newStatus === 'published' ? 'hiện' : 'ẩn'} bình luận thành công`,
          severity: 'success'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể cập nhật trạng thái',
        severity: 'error'
      });
    }
  };

  const handleDeleteContent = async (id, type) => {
    try {
      if (type === 'post') {
        await deletePost(id);
        setPosts(posts.filter(post => (post._id || post.id) !== id));
        setSnackbar({
          open: true,
          message: 'Đã xóa bài viết thành công',
          severity: 'success'
        });
      } else {
        await deleteComment(id);
        setComments(comments.filter(comment => (comment._id || comment.id) !== id));
        setSnackbar({
          open: true,
          message: 'Đã xóa bình luận thành công',
          severity: 'success'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Không thể xóa nội dung',
        severity: 'error'
      });
    }
  };

  const handleAddBannedWord = () => {
    if (newWord.trim()) {
      setBannedWords([
        ...bannedWords,
        {
          id: Date.now(),
          word: newWord.trim(),
          category: wordCategory,
          addedBy: 'Admin',
          addedAt: new Date().toISOString().split('T')[0],
        },
      ]);
      setNewWord('');
      setOpenWordDialog(false);
    }
  };

  const handleDeleteWord = (id) => {
    setBannedWords(bannedWords.filter(word => word.id !== id));
  };

  const getStatusColor = (status) => {
    return status === 'published' ? 'success' : 'error';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'spam': return 'error';
      case 'hate-speech': return 'warning';
      case 'fraud': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Quản lý Nội dung
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kiểm duyệt bài viết, bình luận và quản lý từ khóa nhạy cảm
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab key="posts-tab" label="Bài viết" />
        <Tab key="comments-tab" label="Bình luận" />
        <Tab key="keywords-tab" label="Bộ lọc từ khóa" />
        <Tab key="media-tab" label="Media" />
      </Tabs>

      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <TextField
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '400px' }}
              />
              <Button variant="outlined" startIcon={<FilterList />}>
                Bộ lọc
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tiêu đề</TableCell>
                    <TableCell>Tác giả</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Likes</TableCell>
                    <TableCell align="center">Bình luận</TableCell>
                    <TableCell align="center">Báo cáo</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {posts.map((post, index) => (
                    <TableRow key={post._id || post.id || `post-${index}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {post.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{post.artistId?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          label={post.visibility === 'published' ? 'Công khai' : post.visibility === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}
                          size="small"
                          color={getStatusColor(post.visibility)}
                        />
                      </TableCell>
                      <TableCell align="center">{post.likeCount || post.likes || 0}</TableCell>
                      <TableCell align="center">{post.commentCount || (Array.isArray(post.comments) ? post.comments.length : 0)}</TableCell>
                      <TableCell align="center">
                        {(post.reportCount || post.reports || 0) > 0 ? (
                          <Chip label={post.reportCount || post.reports} size="small" color="error" />
                        ) : (
                          post.reportCount || post.reports || 0
                        )}
                      </TableCell>
                      <TableCell>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewContent(post)}
                            title="Xem chi tiết"
                          >
                            <Info fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleToggleVisibility(post._id || post.id, 'post')}
                            title={post.visibility === 'published' ? 'Ẩn' : 'Hiện'}
                          >
                            {post.visibility === 'hidden' ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteContent(post._id || post.id, 'post')}
                            title="Xóa"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
              }
              sx={{
                '.MuiTablePagination-toolbar': {
                  alignItems: 'center'
                },
                '.MuiTablePagination-selectLabel': {
                  margin: 0
                },
                '.MuiTablePagination-displayedRows': {
                  margin: 0
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <TextField
                placeholder="Tìm kiếm bình luận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '400px' }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bài viết</TableCell>
                    <TableCell>Tác giả</TableCell>
                    <TableCell>Nội dung</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="center">Báo cáo</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comments.map((comment, index) => (
                    <TableRow key={comment._id || comment.id || `comment-${index}`} hover>
                      <TableCell>{comment.postId?.title || "NaN"}</TableCell>
                      <TableCell>{comment.userId.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {comment.content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comment.visibility === "published" ? 'Công khai' : 'Đã ẩn'}
                          size="small"
                          color={getStatusColor(comment.visibility)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {comment.reports > 0 ? (
                          <Chip label={comment.reports} size="small" color="error" />
                        ) : (
                          comment.reports
                        )}
                      </TableCell>
                      <TableCell>{comment.createdAt}</TableCell>
                      <TableCell>
                        <Box display="flex" justifyContent="center" gap={0.5}>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleToggleVisibility(comment._id, 'comment')}
                            title={comment.visibility === 'published' ? 'Hiện' : 'Ẩn'}
                          >
                            {comment.visibility === 'hidden' ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteContent(comment.id, 'comment')}
                            title="Xóa"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} của ${count !== -1 ? count : `nhiều hơn ${to}`}`
              }
              sx={{
                '.MuiTablePagination-toolbar': {
                  alignItems: 'center'
                },
                '.MuiTablePagination-selectLabel': {
                  margin: 0
                },
                '.MuiTablePagination-displayedRows': {
                  margin: 0
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Danh sách từ khóa bị cấm</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenWordDialog(true)}
              >
                Thêm từ khóa
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Từ khóa</TableCell>
                    <TableCell>Danh mục</TableCell>
                    <TableCell>Người thêm</TableCell>
                    <TableCell>Ngày thêm</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bannedWords.map((word) => (
                    <TableRow key={word.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {word.word}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={word.category}
                          size="small"
                          color={getCategoryColor(word.category)}
                        />
                      </TableCell>
                      <TableCell>{word.addedBy}</TableCell>
                      <TableCell>{word.addedAt}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteWord(word.id)}
                          title="Xóa"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Media Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quản lý Media
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <ImageIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                    <Typography variant="h4">1,234</Typography>
                    <Typography variant="body2">Tổng hình ảnh</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <ImageIcon sx={{ fontSize: 60, color: 'success.main' }} />
                    <Typography variant="h4">45 GB</Typography>
                    <Typography variant="body2">Dung lượng sử dụng</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Block sx={{ fontSize: 60, color: 'error.main' }} />
                    <Typography variant="h4">12</Typography>
                    <Typography variant="body2">Media bị chặn</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableWindowBlurListener
        ClickAwayListenerProps={{ mouseEvent: false, touchEvent: false }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
      >
        <DialogTitle>Chi tiết nội dung</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedItem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Tác giả: {selectedItem.author} | Ngày tạo: {selectedItem.createdAt}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedItem.content}
              </Typography>
              <Box display="flex" gap={2}>
                <Chip label={`${selectedItem.likes} likes`} />
                <Chip label={`${selectedItem.comments} comments`} />
                <Chip label={`${selectedItem.reports} reports`} color="error" />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openWordDialog} 
        onClose={() => setOpenWordDialog(false)} 
        maxWidth="sm" 
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
      >
        <DialogTitle>Thêm từ khóa bị cấm</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Từ khóa"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Danh mục"
              value={wordCategory}
              onChange={(e) => setWordCategory(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="spam">Spam</option>
              <option value="hate-speech">Hate Speech</option>
              <option value="fraud">Fraud</option>
              <option value="adult">Adult Content</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWordDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAddBannedWord}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminContentPage;
