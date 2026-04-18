package deal

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/silkroadhub/backend/internal/middleware"
	"github.com/silkroadhub/backend/internal/pkg/apierror"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetPayments(c *gin.Context) {
	plan, err := h.svc.GetPaymentPlan(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.OK(c, http.StatusOK, nil)
		return
	}
	apierror.OK(c, http.StatusOK, plan)
}

func (h *Handler) CreatePaymentPlan(c *gin.Context) {
	var in CreatePaymentPlanInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	plan, err := h.svc.CreatePaymentPlan(c.Request.Context(), c.Param("id"), &in)
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, plan)
}

func (h *Handler) UpdatePaymentStage(c *gin.Context) {
	var in UpdatePaymentStageInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	dealID := c.Param("id")
	if err := h.svc.UpdatePaymentStage(c.Request.Context(), dealID, &in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	plan, err := h.svc.GetPaymentPlan(c.Request.Context(), dealID)
	if err != nil {
		apierror.Internal(c, "failed to load updated payment plan")
		return
	}
	apierror.OK(c, http.StatusOK, plan)
}

func (h *Handler) GetGuarantees(c *gin.Context) {
	guarantees, err := h.svc.GetGuarantees(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusOK, guarantees)
}

func (h *Handler) ListComments(c *gin.Context) {
	items, err := h.svc.ListComments(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if items == nil {
		items = []*Comment{}
	}
	apierror.OK(c, http.StatusOK, items)
}

func (h *Handler) CreateComment(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}
	var in CreateCommentInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	author := sess.Name
	if author == "" {
		author = sess.Email
	}
	comment, err := h.svc.CreateComment(c.Request.Context(), c.Param("id"), author, sess.Role, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, comment)
}

func (h *Handler) ListDocuments(c *gin.Context) {
	items, err := h.svc.ListDocuments(c.Request.Context(), c.Param("id"))
	if err != nil {
		apierror.Internal(c, err.Error())
		return
	}
	if items == nil {
		items = []*Document{}
	}
	apierror.OK(c, http.StatusOK, items)
}

func (h *Handler) CreateDocument(c *gin.Context) {
	sess := middleware.GetSession(c)
	if sess == nil {
		apierror.Unauthorized(c, "")
		return
	}
	var in CreateDocumentInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}

	doc, err := h.svc.CreateDocument(c.Request.Context(), c.Param("id"), sess.Role, &in)
	if err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	apierror.OK(c, http.StatusCreated, doc)
}

func (h *Handler) SetGuarantee(c *gin.Context) {
	var in SetGuaranteeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	dealID := c.Param("id")
	if err := h.svc.SetGuarantee(c.Request.Context(), dealID, &in); err != nil {
		apierror.BadRequest(c, err.Error())
		return
	}
	guarantees, err := h.svc.GetGuarantees(c.Request.Context(), dealID)
	if err != nil {
		apierror.Internal(c, "failed to load updated guarantees")
		return
	}
	apierror.OK(c, http.StatusOK, guarantees)
}
