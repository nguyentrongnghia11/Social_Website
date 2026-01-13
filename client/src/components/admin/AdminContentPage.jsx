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

  useEffect(() => {
    loadContentData();
  }, [tabValue]);

  const loadContentData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (tabValue) {
        case 0:
          const postsRes = await getPosts();
          console.log("Posts response:", postsRes.data.data);
          setPosts(postsRes.data.data);
          break;
        case 1:
          const commentsRes = await getComments();
          setComments(commentsRes.data.data);
          break;
        case 2:
          const wordsRes = await getBannedWords();
          setBannedWords(wordsRes.data.data);
          break;
        case 3:
          const mediaRes = await getMedia();
          setMedia(mediaRes.data);
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };



  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openWordDialog, setOpenWordDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newWord, setNewWord] = useState('');
  const [wordCategory, setWordCategory] = useState('spam');

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

  const handleToggleVisibility = (id, type) => {
    if (type === 'post') {
      setPosts(posts.map(post =>
        post.id === id
          ? { ...post, status: post.status === 'published' ? 'hidden' : 'published' }
          : post
      ));
    } else {
      setComments(comments.map(comment =>
        comment.id === id
          ? { ...comment, status: comment.status === 'published' ? 'hidden' : 'published' }
          : comment
      ));
    }
  };

  const handleDeleteContent = (id, type) => {
    if (type === 'post') {
      setPosts(posts.filter(post => post.id !== id));
    } else {
      setComments(comments.filter(comment => comment.id !== id));
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
        <Tab label="Bài viết" />
        <Tab label="Bình luận" />
        <Tab label="Bộ lọc từ khóa" />
        <Tab label="Media" />
      </Tabs>

      {/* Posts Tab */}
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
                          label={post.status === 'published' ? 'Công khai' : post.status === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}
                          size="small"
                          color={getStatusColor(post.status)}
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
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleToggleVisibility(post._id || post.id, 'post')}
                            title={post.status === 'published' ? 'Ẩn' : 'Hiện'}
                          >
                            {post.status === 'published' ? (
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
              count={posts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số dòng mỗi trang:"
            />
          </CardContent>
        </Card>
      )}

      {/* Comments Tab */}
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
                  {comments.map((comment) => (
                    <TableRow key={comment.id} hover>
                      <TableCell>{comment.postTitle}</TableCell>
                      <TableCell>{comment.author}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {comment.content}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comment.status === 'published' ? 'Công khai' : 'Đã ẩn'}
                          size="small"
                          color={getStatusColor(comment.status)}
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
                            onClick={() => handleToggleVisibility(comment.id, 'comment')}
                            title={comment.status === 'published' ? 'Ẩn' : 'Hiện'}
                          >
                            {comment.status === 'published' ? (
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
          </CardContent>
        </Card>
      )}

      {/* Word Filtering Tab */}
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

      {/* View Content Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
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

      {/* Add Word Dialog */}
      <Dialog open={openWordDialog} onClose={() => setOpenWordDialog(false)} maxWidth="sm" fullWidth>
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
