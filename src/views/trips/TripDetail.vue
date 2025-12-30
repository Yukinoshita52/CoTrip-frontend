<template>
  <Layout>
    <div class="trip-detail" v-loading="loading">
      <el-empty v-if="!loading && !trip" description="行程不存在或已删除" />
      <template v-if="trip">
      <!-- 行程头部 -->
      <div class="trip-header">
        <div class="header-content">
          <div class="trip-info">
            <h1>{{ trip.title }}</h1>
            <div class="trip-meta">
              <span class="destination">
                <el-icon><MapLocation /></el-icon>
                {{ trip.destination }}
              </span>
              <span class="date-range">
                <el-icon><Calendar /></el-icon>
                {{ formatDateRange(trip.startDate, trip.endDate) }}
              </span>
              <el-tag :type="getTripStatusType(trip.status)">
                {{ getTripStatusText(trip.status) }}
              </el-tag>
            </div>
            <p class="trip-description">{{ trip.description }}</p>
          </div>
          <div class="trip-actions">
            <el-button @click="handleEdit" v-if="hasEditPermission">
              <el-icon><Edit /></el-icon>
              编辑行程
            </el-button>
            <el-button @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button type="danger" @click="handleDeleteTrip" v-if="isOwner">
              <el-icon><Delete /></el-icon>
              删除行程
            </el-button>
            <el-button type="danger" @click="handleLeaveTrip" v-if="isParticipant">
              <el-icon><CircleClose /></el-icon>
              退出行程
            </el-button>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="trip-tabs">
        <!-- 行程安排 -->
        <el-tab-pane label="行程安排" name="itinerary">
          <div class="itinerary-section">
            <div class="section-header">
              <h3>行程安排</h3>
              <div class="section-actions" v-if="hasEditPermission">
                <el-button @click="showAddItinerary = true" class="action-btn-modern">
                  <el-icon><Plus /></el-icon>
                  添加安排
                </el-button>
                <el-button type="primary" plain @click="showBatchImport = true" class="action-btn-modern">
                  <el-icon><Upload /></el-icon>
                  批量导入
                </el-button>
                <el-button type="success" plain @click="handleAutoPlan" :loading="autoPlanning" class="action-btn-modern">
                  一键规划
                </el-button>
                <el-button type="warning" plain @click="toggleEditRoute" class="action-btn-modern" v-if="selectedDay !== null && selectedDay !== 0">
                  <el-icon><EditPen /></el-icon>
                  {{ isEditingRoute ? '完成编辑' : '编辑路线' }}
                </el-button>
              </div>
            </div>
            
            <!-- 日期按钮列表 -->
            <div class="date-buttons">
              <el-button 
                :type="selectedDay === null ? 'primary' : ''" 
                size="small"
                @click="handleSelectDay(null)"
              >
                总览
              </el-button>
              <el-button
                v-for="day in availableDays" 
                :key="day"
                :type="selectedDay === day ? 'primary' : ''" 
                size="small"
                @click="handleSelectDay(day)"
              >
                {{ getDayDate(day) }}
              </el-button>
              <el-button
                :type="selectedDay === 0 ? 'primary' : ''"
                size="small"
                @click="handleSelectDay(0)"
              >
                未规划
              </el-button>
            </div>
            
            <!-- 地图显示区域（只在选择具体天数时显示，放在日期按钮下面） -->
            <div v-if="shouldShowMap" class="route-map-container">
              <div class="map-header">
                <h4>路线规划</h4>
                <el-button size="small" @click="refreshRoute" :loading="routeLoading">
                  刷新路线
                </el-button>
              </div>
              <div id="baidu-map" class="baidu-map"></div>
              <div v-if="routeInfo" class="route-info">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="route-info-item">
                      <span>总距离：{{ formatDistance(routeInfo.distance) }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="route-info-item">
                      <span>预计时间：{{ formatDuration(routeInfo.duration) }}</span>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
            
            <!-- 未规划地图显示区域（只显示地点标记，不规划路线） -->
            <div v-if="shouldShowUnplannedMap" class="route-map-container">
              <div class="map-header">
                <h4>地点分布</h4>
                <el-button size="small" @click="refreshUnplannedMap" :loading="routeLoading">
                  刷新地图
                </el-button>
              </div>
              <div id="unplanned-map" class="baidu-map"></div>
            </div>

            <!-- 行程列表 -->
            <div class="itinerary-timeline">
              <!-- 总览模式：显示所有天数 -->
              <template v-if="selectedDay === null">
                <div v-for="[day, dayItems] in groupedItineraryByDay" :key="day" class="day-group">
                  <div class="day-header">
                    <h4>{{ day === 0 ? '未规划' : `第${day}天` }}</h4>
                    <span v-if="day !== 0" class="day-date">{{ getDayDate(day) }}</span>
                    <span class="day-count">{{ dayItems.length }} 项安排</span>
                  </div>
                  
                  <div class="day-items">
                    <template v-for="(item, index) in dayItems" :key="item.id">
                      <div class="itinerary-item">
                        <div class="item-type-icon">
                          <img :src="getPlaceTypeImage(item.type, item.typeId)" :alt="getItemTypeText(item.type)" class="type-image" />
                        </div>
                        <div class="item-content">
                          <div class="item-header">
                            <span class="item-title clickable" @click="handleShowPlaceDetail(item)">{{ item.title }}</span>
                            <el-tag size="small" :type="getItemTypeColor(item.type)">
                              {{ getItemTypeText(item.type) }}
                            </el-tag>
                          </div>
                          <div class="item-location clickable" @click="handleShowPlaceDetail(item)">
                            <el-icon><Location /></el-icon>
                            {{ item.location }}
                          </div>
                          <div v-if="item.description" class="item-description">
                            {{ item.description }}
                          </div>
                          <div v-if="item.cost" class="item-cost">
                            预算：¥{{ item.cost }}
                          </div>
                        </div>
                        <div class="item-actions" v-if="hasEditPermission">
                          <el-button text @click="editItineraryItem(item)">
                            <el-icon><Edit /></el-icon>
                          </el-button>
                          <el-button text type="danger" @click="deleteItineraryItem(item)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                      </div>
                      <!-- 交通信息：只在具体日期下显示，总览模式不显示 -->
                      <div v-if="false"
                           class="transport-info-item">
                        <div class="transport-info-content">
                          <el-icon class="transport-icon"><ArrowRight /></el-icon>
                          <div class="transport-details">
                            <template v-if="getTransportInfo(item.id, dayItems[index + 1].id)">
                              <div class="transport-modes">
                                <div v-if="getTransportInfo(item.id, dayItems[index + 1].id)?.driving && getTransportInfo(item.id, dayItems[index + 1].id)!.driving!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Van /></el-icon>
                                  <span>驾车：{{ formatDistance(getTransportInfo(item.id, dayItems[index + 1].id)!.driving!.distance) }}，{{ formatDuration(getTransportInfo(item.id, dayItems[index + 1].id)!.driving!.duration) }}</span>
                                </div>
                                <div v-if="getTransportInfo(item.id, dayItems[index + 1].id)?.transit && getTransportInfo(item.id, dayItems[index + 1].id)!.transit!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Guide /></el-icon>
                                  <span>公交：{{ formatDistance(getTransportInfo(item.id, dayItems[index + 1].id)!.transit!.distance) }}，{{ formatDuration(getTransportInfo(item.id, dayItems[index + 1].id)!.transit!.duration) }}</span>
                                </div>
                                <div v-if="getTransportInfo(item.id, dayItems[index + 1].id)?.walking && getTransportInfo(item.id, dayItems[index + 1].id)!.walking!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Promotion /></el-icon>
                                  <span>步行：{{ formatDistance(getTransportInfo(item.id, dayItems[index + 1].id)!.walking!.distance) }}，{{ formatDuration(getTransportInfo(item.id, dayItems[index + 1].id)!.walking!.duration) }}</span>
                                </div>
                              </div>
                            </template>
                            <div v-else-if="isTransportInfoLoading(item.id, dayItems[index + 1].id)" class="transport-loading">
                              <el-icon class="is-loading"><Loading /></el-icon>
                              <span>正在获取路线信息...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <el-empty v-if="groupedItineraryByDay.size === 0" description="暂无行程安排" />
              </template>
              
              <!-- 选择具体天数：只显示该天的行程 -->
              <template v-else>
                <div v-if="selectedDayItems.length > 0" class="day-group">
                  <div class="day-header">
                    <h4>{{ selectedDay === 0 ? '未规划' : `第${selectedDay}天` }}</h4>
                    <span v-if="selectedDay !== 0" class="day-date">{{ getDayDate(selectedDay) }}</span>
                    <span class="day-count">{{ selectedDayItems.length }} 项安排</span>
                  </div>
                  
                  <div class="day-items">
                    <template v-for="(item, index) in selectedDayItems" :key="item.id">
                      <div
                        class="itinerary-item"
                        :class="{
                          'dragging': isEditingRoute && draggedIndex === index,
                          'drag-over': isEditingRoute && dragOverIndex === index && draggedIndex !== index,
                          'draggable-item': isEditingRoute
                        }"
                        :draggable="isEditingRoute"
                        @dragstart="handleDragStart($event, index)"
                        @dragover="handleDragOver($event, index)"
                        @dragleave="handleDragLeave"
                        @drop="handleDrop($event, index)"
                      >
                        <div class="item-type-icon">
                          <img :src="getPlaceTypeImage(item.type, item.typeId)" :alt="getItemTypeText(item.type)" class="type-image" />
                        </div>
                        <div class="item-content">
                          <div class="item-header">
                            <span class="item-title clickable" @click="handleShowPlaceDetail(item)">{{ item.title }}</span>
                            <el-tag size="small" :type="getItemTypeColor(item.type)">
                              {{ getItemTypeText(item.type) }}
                            </el-tag>
                          </div>
                          <div class="item-location clickable" @click="handleShowPlaceDetail(item)">
                            <el-icon><Location /></el-icon>
                            {{ item.location }}
                          </div>
                          <div v-if="item.description" class="item-description">
                            {{ item.description }}
                          </div>
                          <div v-if="item.cost" class="item-cost">
                            预算：¥{{ item.cost }}
                          </div>
                        </div>
                        <div class="item-actions" v-if="hasEditPermission">
                          <el-button text @click="editItineraryItem(item)">
                            <el-icon><Edit /></el-icon>
                          </el-button>
                          <el-button text type="danger" @click="deleteItineraryItem(item)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                      </div>
                      <!-- 交通信息：显示在两个地点之间 -->
                      <div v-if="selectedDay !== 0 && index < selectedDayItems.length - 1 && item.lat && item.lng && selectedDayItems[index + 1]?.lat && selectedDayItems[index + 1]?.lng && !shouldSkipTransport(item, selectedDayItems[index + 1])"
                           class="transport-info-item">
                        <div class="transport-info-content">
                          <el-icon class="transport-icon"><ArrowRight /></el-icon>
                          <div class="transport-details">
                            <template v-if="getTransportInfo(item.id, selectedDayItems[index + 1].id)">
                              <div class="transport-modes">
                                <div v-if="getTransportInfo(item.id, selectedDayItems[index + 1].id)?.driving && getTransportInfo(item.id, selectedDayItems[index + 1].id)!.driving!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Van /></el-icon>
                                  <span>驾车：{{ formatDistance(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.driving!.distance) }}，{{ formatDuration(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.driving!.duration) }}</span>
                                </div>
                                <div v-if="getTransportInfo(item.id, selectedDayItems[index + 1].id)?.transit && getTransportInfo(item.id, selectedDayItems[index + 1].id)!.transit!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Guide /></el-icon>
                                  <span>公交：{{ formatDistance(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.transit!.distance) }}，{{ formatDuration(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.transit!.duration) }}</span>
                                </div>
                                <div v-if="getTransportInfo(item.id, selectedDayItems[index + 1].id)?.walking && getTransportInfo(item.id, selectedDayItems[index + 1].id)!.walking!.distance > 0" 
                                     class="transport-mode">
                                  <el-icon><Promotion /></el-icon>
                                  <span>步行：{{ formatDistance(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.walking!.distance) }}，{{ formatDuration(getTransportInfo(item.id, selectedDayItems[index + 1].id)!.walking!.duration) }}</span>
                                </div>
                              </div>
                            </template>
                            <div v-else-if="isTransportInfoLoading(item.id, selectedDayItems[index + 1].id)" class="transport-loading">
                              <el-icon class="is-loading"><Loading /></el-icon>
                              <span>正在获取路线信息...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <el-empty v-else :description="selectedDay === 0 ? '暂无未规划的地点' : '该天暂无行程安排'" />
              </template>
            </div>
          </div>
        </el-tab-pane>

        <!-- 成员管理 -->
        <el-tab-pane label="成员管理" name="members">
          <div class="members-section">
            <div class="section-header">
              <h3>成员管理</h3>
              <el-button @click="showInviteMember = true" v-if="isOwner || getUserRoleInTrip() === 'admin'">
                <el-icon><UserFilled /></el-icon>
                邀请成员
              </el-button>
            </div>
            
            <div class="members-grid">
              <!-- 正式成员 -->
              <div v-for="member in trip.members" :key="member.userId" class="member-card">
                <el-avatar :size="60" :src="formatAvatarUrl(member.avatar)">
                  {{ member.username.charAt(0) }}
                </el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ member.username }}</div>
                  <el-tag size="small" :type="member.role === 'owner' ? 'success' : ''">
                    {{ getRoleText(member.role) }}
                  </el-tag>
                  <div class="member-joined">
                    加入时间：{{ formatDate(member.joinedAt) }}
                  </div>
                </div>
                <div class="member-actions" v-if="member.role !== 'owner' && (isOwner || getUserRoleInTrip() === 'admin')">
                  <el-dropdown>
                    <el-button text>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="changeRole(member)">
                          更改角色
                        </el-dropdown-item>
                        <el-dropdown-item @click="removeMember(member)" divided>
                          移除成员
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              
              <!-- 待接受邀请的成员 -->
              <div v-for="invitation in pendingInvitations" :key="invitation.invitationId" class="member-card pending-invitation">
                <el-avatar :size="60">{{ invitation.invitee?.charAt(0) || 'U' }}</el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ invitation.invitee }}</div>
                  <el-tag size="small" type="warning">待接受邀请</el-tag>
                  <div class="member-joined">
                    邀请时间：{{ formatDate(invitation.sentTime) }}
                  </div>
                </div>
                <div class="member-actions">
                  <el-button text type="danger" @click="cancelInvitation(invitation.invitationId)">
                    <el-icon><Delete /></el-icon>
                    撤销
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      </template>
    </div>

    <!-- 添加行程安排对话框 -->
    <el-dialog 
      v-model="showAddItinerary" 
      title="添加行程安排" 
      width="700px"
      class="add-itinerary-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Plus /></el-icon>
          </div>
          <span class="header-title">添加行程安排</span>
        </div>
      </template>
      <el-form :model="itineraryForm" :rules="itineraryRules" ref="itineraryFormRef" label-width="100px" class="itinerary-form-modern">
        <el-form-item label="选择天数" prop="day">
          <el-select 
            v-model="itineraryForm.day" 
            placeholder="请选择第几天" 
            style="width: 100%"
            class="form-select-modern"
          >
            <el-option label="未规划" :value="0" />
            <el-option
              v-for="day in availableDays" 
              :key="day" 
              :label="`第${day}天 (${formatDayDate(day)})`" 
              :value="day"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="搜索地点" prop="placeName">
          <el-autocomplete
            v-model="itineraryForm.placeName"
            :fetch-suggestions="fetchPlaceSuggestions"
            placeholder="输入地点名称搜索"
            style="width: 100%"
            @select="handlePlaceSelect"
            clearable
            class="form-autocomplete-modern"
          >
            <template #prefix>
              <el-icon class="input-icon"><Search /></el-icon>
            </template>
            <template #default="{ item }">
              <div class="suggestion-item-modern">
                <el-icon class="suggestion-icon"><Location /></el-icon>
                <span class="suggestion-name">{{ item.name }}</span>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        
        <el-form-item label="地点类型" prop="placeType" v-if="selectedPlace">
          <el-select 
            v-model="itineraryForm.placeType" 
            placeholder="请选择地点类型" 
            style="width: 100%"
            class="form-select-modern"
          >
            <el-option
              v-for="type in placeTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        
        <div v-if="selectedPlace" class="selected-place-modern">
          <div class="selected-place-header">
            <el-icon class="selected-icon"><Check /></el-icon>
            <h4>已选择地点</h4>
          </div>
          <div class="place-info-modern">
            <div class="info-row">
              <span class="info-label">名称：</span>
              <span class="info-value">{{ selectedPlace.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">类型：</span>
              <span class="info-value">{{ getSelectedTypeName() }}</span>
            </div>
            <div class="info-row" v-if="selectedPlace.address">
              <span class="info-label">地址：</span>
              <span class="info-value">{{ selectedPlace.address }}</span>
            </div>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer-modern">
          <el-button @click="showAddItinerary = false" class="cancel-btn-modern">取消</el-button>
          <el-button type="primary" @click="handleAddItinerary" :loading="addingItinerary" class="submit-btn-modern">
            <el-icon><Check /></el-icon>
            添加到行程
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑行程安排对话框 -->
    <el-dialog 
      v-model="showEditItinerary" 
      title="编辑行程安排" 
      width="600px"
      class="edit-itinerary-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><EditPen /></el-icon>
          </div>
          <span class="header-title">编辑行程安排</span>
        </div>
      </template>
      <el-form :model="editItineraryForm" :rules="editItineraryRules" ref="editItineraryFormRef" label-width="100px" class="itinerary-form-modern">
        <el-form-item label="地点名称">
          <el-input :value="currentEditItem?.title" disabled class="form-input-modern">
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="选择天数" prop="day">
          <el-select 
            v-model="editItineraryForm.day" 
            placeholder="请选择第几天" 
            style="width: 100%"
            class="form-select-modern"
          >
            <el-option label="未规划" :value="0" />
            <el-option
              v-for="day in availableDays" 
              :key="day" 
              :label="`第${day}天 (${formatDayDate(day)})`" 
              :value="day"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="地点类型" prop="placeType">
          <el-select 
            v-model="editItineraryForm.placeType" 
            placeholder="请选择地点类型" 
            style="width: 100%"
            class="form-select-modern"
          >
            <el-option
              v-for="type in placeTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer-modern">
          <el-button @click="showEditItinerary = false" class="cancel-btn-modern">取消</el-button>
          <el-button type="primary" @click="handleEditItinerary" :loading="editingItinerary" class="submit-btn-modern">
            <el-icon><Check /></el-icon>
            保存修改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog 
      v-model="showInviteMember" 
      title="邀请成员" 
      width="500px"
      class="invite-member-dialog"
      :close-on-click-modal="false"
    >
      <template #header="{ titleId, titleClass }">
        <div class="invite-dialog-header">
          <div class="invite-dialog-icon-wrapper">
            <el-icon class="invite-dialog-icon"><UserFilled /></el-icon>
          </div>
          <span :id="titleId" :class="titleClass">邀请成员</span>
        </div>
      </template>
      
      <el-form 
        :model="inviteForm" 
        :rules="inviteRules" 
        ref="inviteFormRef" 
        label-position="top"
        class="invite-form"
      >
        <el-form-item prop="invitee" class="invite-form-item">
          <template #label>
            <div class="invite-form-label">
              <el-icon><UserFilled /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>被邀请人手机号</span>
            </div>
          </template>
          <el-input 
            v-model="inviteForm.invitee" 
            placeholder="请输入被邀请人的手机号码（11位）"
            :maxlength="11"
            size="large"
            class="invite-input"
            :prefix-icon="UserFilled"
            clearable
          />
          <div class="invite-form-tip">
            <el-icon class="tip-icon"><InfoFilled /></el-icon>
            <span>请输入11位手机号码，系统将自动查找并邀请该用户</span>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="invite-dialog-footer">
          <el-button 
            @click="handleCancelInvite" 
            size="large"
            class="invite-cancel-button"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="handleInviteMember" 
            :loading="inviteLoading"
            size="large"
            class="invite-submit-button"
          >
            <span v-if="!inviteLoading">
              <el-icon><Check /></el-icon>
              发送邀请
            </span>
            <span v-else>发送中...</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量导入地点对话框 -->
    <el-dialog 
      v-model="showBatchImport" 
      title="批量导入地点" 
      width="700px"
      class="batch-import-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Upload /></el-icon>
          </div>
          <span class="header-title">批量导入地点</span>
        </div>
      </template>
      <el-form label-width="100px" class="batch-import-form-modern">
        <el-form-item label="地点列表">
          <div class="textarea-wrapper-modern">
            <el-input
              v-model="batchImportText"
              type="textarea"
              :rows="10"
              placeholder="请输入你想去的地点，每行一个地点名称&#10;例如：&#10;北京天安门&#10;故宫博物院&#10;颐和园"
              maxlength="5000"
              show-word-limit
              class="form-textarea-modern"
            />
          </div>
          <div class="form-tip-modern">
            <el-icon class="tip-icon"><InfoFilled /></el-icon>
            <span>导入的地点将全部进入"未规划"，你可以稍后分配到具体日期</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer-modern">
          <el-button @click="showBatchImport = false" class="cancel-btn-modern">取消</el-button>
          <el-button type="primary" @click="handleBatchImport" :loading="batchImporting" class="submit-btn-modern">
            <el-icon><Upload /></el-icon>
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 地点详情对话框 -->
    <el-dialog v-model="showPlaceDetail" title="地点详情" width="600px">
      <div v-loading="placeDetailLoading">
        <el-descriptions v-if="placeDetail" :column="1" border>
          <el-descriptions-item label="名称">
            {{ placeDetail.name }}
          </el-descriptions-item>

          <el-descriptions-item label="类型">
            {{ placeDetail.type }}
          </el-descriptions-item>

          <el-descriptions-item label="地址">
            {{ placeDetail.address }}
          </el-descriptions-item>

          <el-descriptions-item
              v-if="hasValue(placeDetail.telephone)"
              label="电话">
            {{ placeDetail.telephone }}
          </el-descriptions-item>

          <el-descriptions-item
              v-if="hasValue(placeDetail.detailInfo?.classified_poi_tag)"
              label="分类标签">
            {{ placeDetail.detailInfo.classified_poi_tag }}
          </el-descriptions-item>

          <el-descriptions-item
              v-if="hasValue(placeDetail.detailInfo?.price)"
              label="价格">
            {{ placeDetail.detailInfo.price }}
          </el-descriptions-item>

          <el-descriptions-item
              v-if="hasValue(placeDetail.detailInfo?.shop_hours)"
              label="营业时间">
            {{ placeDetail.detailInfo.shop_hours }}
          </el-descriptions-item>

          <el-descriptions-item
              v-if="hasValue(placeDetail.detailInfo?.overall_rating)"
              label="评分">
            {{ placeDetail.detailInfo.overall_rating }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <el-button @click="showPlaceDetail = false">关闭</el-button>
      </template>
    </el-dialog>

  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi, placeTypeApi, invitationApi, userApi, baiduRouteApi, transportInfoApi } from '@/api'
import type { Trip, ItineraryItem, TripMember } from '@/types'
import { formatAvatarUrl } from '@/utils/image'
import dayjs from 'dayjs'
import { MapLocation, Calendar, Edit, EditPen, Share, Delete, CircleClose, Plus, Upload, Location, ArrowRight, Van, Guide, Promotion, UserFilled, More, Search, Check, InfoFilled, Loading } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref('itinerary')
const showAddItinerary = ref(false)
const showEditItinerary = ref(false)
const showInviteMember = ref(false)
const showBatchImport = ref(false)
const showPlaceDetail = ref(false)
const autoPlanning = ref(false)

// 编辑路线相关状态
const isEditingRoute = ref(false)
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// 跨 Day 拖拽：记录被拖拽项来自哪一天（编辑模式下使用）
const draggedDay = ref<number | null>(null)

// 编辑模式下的草稿（key=day, value=该天的地点列表，保持顺序）
const itineraryDraftByDay = ref(new Map<number, ItineraryItem[]>())

// 保存中状态
const savingRoute = ref(false)

// 选择的天数（null表示总览，显示所有天数）
const selectedDay = ref<number | null>(null)

// 地图相关状态
const mapInstance = ref<any>(null)
const unplannedMapInstance = ref<any>(null) // 未规划地图实例
const routeInfo = ref<any>(null)
const mapLoaded = ref(false)
const unplannedMapLoaded = ref(false) // 未规划地图是否已加载
const routeLoading = ref(false)

// 交通信息状态：存储每两个地点之间的交通信息
// key格式: "itemId1-itemId2", value: { driving, transit, walking }
const transportInfo = ref<Record<string, {
  driving?: { distance: number; duration: number; loading: boolean },
  transit?: { distance: number; duration: number, loading: boolean },
  walking?: { distance: number; duration: number, loading: boolean }
}>>({})

const loading = ref(false)
const trip = ref<Trip | null>(null)
const pendingInvitations = ref<any[]>([])
const currentUser = ref<any>(null)
const placeDetail = ref<any>(null)
const placeDetailLoading = ref(false)

// 添加行程安排表单
const itineraryFormRef = ref<FormInstance>()
const addingItinerary = ref(false)
const selectedPlace = ref<any>(null)
const placeTypes = ref<any[]>([])
const itineraryForm = ref({
  day: 0,
  placeName: '',
  placeUid: '',
  placeType: null as number | null
})

// 编辑行程安排表单
const editItineraryFormRef = ref<FormInstance>()
const editingItinerary = ref(false)
const currentEditItem = ref<any>(null)
const editItineraryForm = ref({
  day: 1,
  placeType: null as number | null
})

// 邀请成员表单
const inviteFormRef = ref<FormInstance>()
const inviteLoading = ref(false)
const inviteForm = ref({
  invitee: ''
})

// 批量导入表单
const batchImportText = ref('')
const batchImporting = ref(false)

// 行程安排表单验证规则
const itineraryRules: FormRules = {
  day: [
    { required: true, message: '请选择天数', trigger: 'change' }
  ],
  placeName: [
    { required: true, message: '请选择地点', trigger: 'blur' }
  ],
  placeType: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ]
}

// 编辑行程安排表单验证规则
const editItineraryRules: FormRules = {
  day: [
    { required: true, message: '请选择天数', trigger: 'change' }
  ],
  placeType: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ]
}

// 邀请表单验证规则
const inviteRules: FormRules = {
  invitee: [
    { required: true, message: '请输入被邀请人的手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 加载行程详情
const loadTripDetail = async () => {
  const tripId = route.params.id as string
  if (!tripId) {
    ElMessage.error('行程ID无效')
    router.push('/trips')
    return
  }
  
  loading.value = true
  try {
    // 并行加载行程详情和待接受邀请，提升加载速度
    const [tripRes] = await Promise.allSettled([
      tripApi.getTripById(Number(tripId)),
      loadPendingInvitations(Number(tripId)).catch(() => {}) // 忽略错误，不影响主流程
    ])
    
    if (tripRes.status === 'fulfilled' && tripRes.value.code === 200 && tripRes.value.data) {
      const data = tripRes.value.data
      const places = data.places || []
      
      // 转换地点数据为itinerary格式
      const itinerary: any[] = []
      const startDate = dayjs(data.startDate)
      places.forEach((dayPlaces: any) => {
        const day = dayPlaces.day !== null && dayPlaces.day !== undefined ? dayPlaces.day : 1
        const placesList = dayPlaces.places || []
        // 按照sequence字段排序
        placesList.sort((a: any, b: any) => {
          const seqA = a.sequence !== null && a.sequence !== undefined ? a.sequence : Number.MAX_SAFE_INTEGER
          const seqB = b.sequence !== null && b.sequence !== undefined ? b.sequence : Number.MAX_SAFE_INTEGER
          return seqA - seqB
        })
        // 根据天数计算正确的日期（day=0 时使用起始日期）
        const itemDate = day > 0 ? startDate.add(day - 1, 'day').format('YYYY-MM-DD') : startDate.format('YYYY-MM-DD')
        placesList.forEach((place: any, index: number) => {
          const placeId = place.placeId || place.id
          // 调试：打印地点数据
          if (import.meta.env.DEV) {
            console.log('地点数据:', { name: place.name, type: place.type, typeId: place.typeId, sequence: place.sequence })
          }
          itinerary.push({
            id: String(placeId || `${day}-${index}`),
            placeId: placeId, // 添加真实的placeId
            day: day, // 添加天数信息
            sequence: place.sequence, // 添加顺序字段
            tripId: String(data.tripId || tripId),
            title: place.name || '',
            description: place.address || '',
            location: place.name || '',
            lat: place.lat, // 添加纬度
            lng: place.lng, // 添加经度
            startTime: `${itemDate}T09:00:00`,
            endTime: `${itemDate}T18:00:00`,
            type: place.type || '', // 保留原始 type，不设置默认值
            typeId: place.typeId, // 添加类型ID
            cost: 0,
            createdBy: String(data.createdBy || ''),
            createdAt: data.createdTime || ''
          })
        })
      })
      
      // 处理成员数据
      const members: TripMember[] = []
      if (data.members && Array.isArray(data.members)) {
        data.members.forEach((m: any) => {
          members.push({
            userId: String(m.userId || m.id || ''),
            username: m.nickname || m.username || '',
            avatar: m.avatarUrl || undefined,
            role: m.role === 0 ? 'owner' : m.role === 1 ? 'admin' : 'member',
            joinedAt: m.joinedAt || m.createTime || ''
          })
        })
      }
      
      trip.value = {
        id: String(data.tripId || tripId),
        title: data.name || '',
        description: data.description || '',
        destination: data.region || '',
        startDate: data.startDate ? dayjs(data.startDate).format('YYYY-MM-DD') : '',
        endDate: data.endDate ? dayjs(data.endDate).format('YYYY-MM-DD') : '',
        status: 'planning',
        coverImage: '',
        createdBy: String(data.createdBy || ''),
        members: members,
        itinerary: itinerary,
        createdAt: data.createdTime ? dayjs(data.createdTime).format('YYYY-MM-DD') : '',
        updatedAt: data.updatedTime ? dayjs(data.updatedTime).format('YYYY-MM-DD') : ''
      }
    } else {
      const errorMsg = tripRes.status === 'rejected' 
        ? tripRes.reason?.message || '加载行程详情失败'
        : tripRes.value?.message || '加载行程详情失败'
      ElMessage.error(errorMsg)
      router.push('/trips')
    }
  } catch (error: any) {
    console.error('加载行程详情失败:', error)
    ElMessage.error(error.message || '加载行程详情失败')
    router.push('/trips')
  } finally {
    loading.value = false
  }
}

// 加载地点类型
const loadPlaceTypes = async () => {
  try {
    const res = await placeTypeApi.getAllPlaceTypes()
    if (res.code === 200 && res.data) {
      placeTypes.value = res.data
    }
  } catch (error: any) {
    console.error('加载地点类型失败:', error)
  }
}

// 加载待接受邀请的成员
const loadPendingInvitations = async (tripId: number) => {
  try {
    const res = await tripApi.getTripInvitations(tripId)
    if (res.code === 200 && res.data) {
      // 只显示待接受邀请（status === 0）的成员
      pendingInvitations.value = res.data.filter((inv: any) => inv.status === 0)
    }
  } catch (error: any) {
    console.error('加载待接受邀请失败:', error)
  }
}

// 安全读取 sequence（部分数据源可能没有该字段）
const getSequenceSafe = (item: any) => {
  const seq = item?.sequence
  return typeof seq === 'number' ? seq : Number.MAX_SAFE_INTEGER
}

// 计算属性
const availableDays = computed(() => {
  if (!trip.value?.startDate || !trip.value?.endDate) return [1]

  const start = dayjs(trip.value.startDate)
  const end = dayjs(trip.value.endDate)
  const days = end.diff(start, 'day') + 1

  return Array.from({ length: days }, (_, i) => i + 1)
})

// 按天数分组（总览模式）
const groupedItineraryByDay = computed(() => {
  const groups: Record<number, ItineraryItem[]> = {}
  trip.value?.itinerary.forEach(item => {
    const day = item.day !== null && item.day !== undefined ? item.day : 0
    if (!groups[day]) {
      groups[day] = []
    }
    groups[day].push(item)
  })
  // 对每一天的地点按sequence排序
  Object.keys(groups).forEach(dayStr => {
    const day = Number(dayStr)
    groups[day].sort((a: any, b: any) => getSequenceSafe(a) - getSequenceSafe(b))
  })
  // 按天数排序，但day=0（未规划）放在最后
  // 使用Map来保持插入顺序
  const sortedGroups = new Map<number, ItineraryItem[]>()
  Object.keys(groups)
    .map(Number)
    .sort((a, b) => {
      // 0放在最后
      if (a === 0) return 1
      if (b === 0) return -1
      return a - b
    })
    .forEach(day => {
      sortedGroups.set(day, groups[day])
    })
  return sortedGroups
})

// 根据选择的天数筛选行程项
const selectedDayItems = computed(() => {
  if (selectedDay.value === null || !trip.value) return []

  // 编辑中优先展示草稿
  if (isEditingRoute.value) {
    const draft = itineraryDraftByDay.value.get(selectedDay.value)
    return draft ? [...draft] : []
  }

  const items = trip.value.itinerary.filter(item => item.day === selectedDay.value)
  // 按sequence字段排序
  return items.sort((a: any, b: any) => getSequenceSafe(a) - getSequenceSafe(b))
})

// 是否显示路线规划地图（只在选择具体天数时显示，且至少2个地点，day=0不显示）
const shouldShowMap = computed(() => {
  return selectedDay.value !== null && selectedDay.value !== 0 && selectedDayItems.value.length >= 2
})

// 是否显示未规划地图（day=0且至少有1个地点）
const shouldShowUnplannedMap = computed(() => {
  return selectedDay.value === 0 && selectedDayItems.value.some((item: any) => item.lat && item.lng)
})

// 获取当前选择天数的地点坐标
const getCurrentDayPlaces = computed(() => {
  if (selectedDay.value === null) return []
  return selectedDayItems.value
    .filter((item: any) => item.lat && item.lng)
    .map((item: any) => ({
      name: item.title,
      lat: item.lat,
      lng: item.lng,
      id: item.id
    }))
})

// 判断用户在行程中的角色
const getUserRoleInTrip = () => {
  if (!currentUser.value || !trip.value) return null

  const member = trip.value.members.find(m => {
    const memberUserId = Number(m.userId)
    const currentUserId = Number(currentUser.value.id)
    return memberUserId === currentUserId
  })

  return member ? member.role : null
}

// 判断用户是否为行程创建者
const isOwner = computed(() => {
  return getUserRoleInTrip() === 'owner'
})

// 判断用户是否为行程参与者（非创建者）
const isParticipant = computed(() => {
  const role = getUserRoleInTrip()
  return role && role !== 'owner'
})

// 判断用户是否有编辑权限（创建者或管理员）
const hasEditPermission = computed(() => {
  const role = getUserRoleInTrip()
  return role === 'owner' || role === 'admin'
})

onMounted(async () => {
  // 获取当前用户信息
  try {
    const userRes = await userApi.getCurrentUser()
    if (userRes.code === 200 && userRes.data) {
      currentUser.value = userRes.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }

  // 先加载地点类型，再加载行程详情，确保类型数据可用
  await loadPlaceTypes()
  loadTripDetail()
})

// 监听选择的天数变化，自动加载地图和路线
watch([selectedDay, mapLoaded, unplannedMapLoaded], ([day, loaded, unplannedLoaded]) => {
  // 处理普通天数的路线规划地图（day > 0）
  if (day !== null && day !== 0 && loaded) {
    nextTick(() => {
      refreshRoute()
    })
  } else if (day !== null && day !== 0 && !loaded && getCurrentDayPlaces.value.length >= 2) {
    initMap().then(() => {
      getRoute()
    })
  }

  // 处理未规划的地图（day = 0）
  if (day === 0 && unplannedLoaded) {
    nextTick(() => {
      showUnplannedMarkers()
    })
  } else if (day === 0 && !unplannedLoaded && getCurrentDayPlaces.value.length > 0) {
    initUnplannedMap().then(() => {
      showUnplannedMarkers()
    })
  }
}, { immediate: false })

// 监听选择的天数变化，当选择具体日期时加载该天的交通信息
watch(selectedDay, async (day) => {
  // 只在选择具体日期时（非总览、非null）加载交通信息
  if (day === null || day === 0 || !trip.value?.itinerary) return

  const items = selectedDayItems.value
  if (items.length >= 2) {
    // 按时间排序
    const sortedItems = [...items].sort((a, b) => {
      const timeA = dayjs(a.startTime).valueOf()
      const timeB = dayjs(b.startTime).valueOf()
      return timeA - timeB
    })
    await loadTransportInfoForDay(sortedItems)
  }
}, { immediate: false })

// 计算两点间的直线距离（米），用于判断是否需要交通
const computeDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371000 // 地球半径（米）
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 判断两个地点之间是否无需交通：未规划页面或两点很近
const shouldSkipTransport = (item1: any, item2: any, nearThresholdMeters: number = 200) => {
  if (selectedDay.value === 0) return true
  if (!item1?.lat || !item1?.lng || !item2?.lat || !item2?.lng) return true
  const distance = computeDistanceMeters(item1.lat, item1.lng, item2.lat, item2.lng)
  return distance < nearThresholdMeters
}

// 加载某一天所有地点之间的交通信息
const loadTransportInfoForDay = async (items: any[]) => {
  if (items.length < 2) return

  for (let i = 0; i < items.length - 1; i++) {
    const item1 = items[i]
    const item2 = items[i + 1]

    // 跳过不需要交通的情况
    if (shouldSkipTransport(item1, item2)) {
      continue
    }

    if (item1.lat && item1.lng && item2.lat && item2.lng) {
      await Promise.all([
        fetchRouteBetweenPlaces(item1, item2, 'driving'),
        fetchRouteBetweenPlaces(item1, item2, 'transit'),
        fetchRouteBetweenPlaces(item1, item2, 'walking')
      ])
    }
  }
}

// 工具函数
// 判断值是否有效（非空、非null、非undefined）
const hasValue = (value: any): boolean => {
  return value !== null && value !== undefined && value !== ''
}

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('MM月DD日') : ''
}


const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
  if (!startDate || !endDate) return ''
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid()) return ''
  return `${start.format('MM-DD')} ~ ${end.format('MM-DD')}`
}

const getTripStatusType = (status: string) => {
  const types: Record<string, string> = {
    planning: '',
    ongoing: 'success',
    completed: 'info'
  }
  return types[status] || ''
}

const getTripStatusText = (status: string) => {
  const texts: Record<string, string> = {
    planning: '计划中',
    ongoing: '进行中',
    completed: '已完成'
  }
  return texts[status] || status
}

const getItemTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    transport: 'primary',
    accommodation: 'success',
    activity: 'warning',
    dining: 'danger',
    other: 'info'
  }
  return colors[type] || 'info'
}

const getItemTypeText = (type: string) => {
  const texts: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    activity: '活动',
    dining: '餐饮',
    other: '其他'
  }
  return texts[type] || type
}

// 根据地点类型获取对应的图片
const getPlaceTypeImage = (type: string, typeId?: number) => {
  let typeCode = type || ''
  
  // 如果 type 为空或无效，尝试从 placeTypes 中根据 typeId 查找
  if (!typeCode && typeId && placeTypes.value.length > 0) {
    const placeType = placeTypes.value.find(pt => pt.id === typeId)
    if (placeType && placeType.code) {
      typeCode = placeType.code
    }
  }
  
  // 类型编码到图片的映射（支持多种可能的编码格式）
  const imageMap: Record<string, string> = {
    // 住宿相关编码
    'accommodation': '/住宿.png',
    'hotel': '/住宿.png',
    '住宿': '/住宿.png',
    // 餐饮相关编码
    'dining': '/餐饮.png',
    'restaurant': '/餐饮.png',
    'food': '/餐饮.png',
    '餐饮': '/餐饮.png',
    // 景点/活动相关编码
    'activity': '/景点.png',
    'sight': '/景点.png',
    'attraction': '/景点.png',
    '景点': '/景点.png',
    '活动': '/景点.png',
    // 交通相关编码
    'transport': '/景点.png',
    '交通': '/景点.png',
    // 其他类型
    'other': '/景点.png',
    '其他': '/景点.png'
  }
  
  // 转换为小写进行匹配
  const lowerType = typeCode.toLowerCase()
  const imagePath = imageMap[lowerType] || '/景点.png'
  
  // 调试信息（开发环境）
  if (import.meta.env.DEV && !imageMap[lowerType]) {
    console.log('未匹配到图片类型:', { type, typeCode, typeId, lowerType, imagePath })
  }
  
  return imagePath
}

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    owner: '创建者',
    admin: '管理员',
    member: '参与者'
  }
  return texts[role] || role
}

// 事件处理
const handleEdit = () => {
  // 跳转到编辑页面
  router.push(`/trips/${route.params.id}/edit`)
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleLeaveTrip = async () => {
  try {
    await ElMessageBox.confirm('确定要退出这个行程吗？退出后将无法查看行程信息和账单。', '确认退出', {
      type: 'warning'
    })

    const tripId = Number(route.params.id)
    if (isNaN(tripId)) {
      ElMessage.error('行程ID无效')
      return
    }

    const res = await tripApi.leaveTrip(tripId)

    if (res.code === 200) {
      ElMessage.success('已退出行程')
      router.push('/trips') // 跳转回行程列表
    } else {
      ElMessage.error(res.message || '退出失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('退出行程失败:', error)
      ElMessage.error(error.message || '退出失败')
    }
  }
}

const handleDeleteTrip = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这个行程吗？删除后无法恢复，相关的账单和数据也会被删除。', '确认删除', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })

    const tripId = Number(route.params.id)
    if (isNaN(tripId)) {
      ElMessage.error('行程ID无效')
      return
    }

    const res = await tripApi.deleteTrip(tripId)

    if (res.code === 200) {
      ElMessage.success('行程已删除')
      router.push('/trips') // 跳转回行程列表
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('删除行程失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleAutoPlan = async () => {
  const tripId = Number(route.params.id)
  if (!tripId) {
    ElMessage.error('行程ID无效')
    return
  }
  try {
    autoPlanning.value = true
    const res = await tripApi.autoPlanRoute(tripId)
    if (res.code === 200) {
      ElMessage.success(res.data || '一键规划成功')

      // 清空交通缓存状态，避免旧 key/旧 loading 状态影响展示
      transportInfo.value = {}

      // 重新加载行程详情
      await loadTripDetail()
      await nextTick()

      // 主动触发交通加载与地图路线刷新
      const day = selectedDay.value
      if (day !== null && day !== 0) {
        const items = selectedDayItems.value
        if (items.length >= 2) {
          const sortedItems = [...items].sort((a: any, b: any) => {
            const timeA = dayjs(a.startTime).valueOf()
            const timeB = dayjs(b.startTime).valueOf()
            return timeA - timeB
          })
          await loadTransportInfoForDay(sortedItems)
          refreshRoute()
        }
      }
    } else {
      ElMessage.error(res.message || '一键规划失败')
    }
  } catch (error: any) {
    console.error('一键规划失败:', error)
    ElMessage.error(error.message || '一键规划失败，请稍后再试')
  } finally {
    autoPlanning.value = false
  }
}

// 切换编辑路线模式
const toggleEditRoute = async () => {
  // 进入编辑：初始化草稿
  if (!isEditingRoute.value) {
    initItineraryDraft()
    isEditingRoute.value = true
    return
  }

  // 点击保存
  await saveRouteDraft()
}

// 拖拽开始（编辑模式下：仅支持单日内排序）
const handleDragStart = (event: DragEvent, index: number) => {
  if (!isEditingRoute.value || selectedDay.value === null) return
  draggedIndex.value = index
  draggedDay.value = null
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('application/json', JSON.stringify({
    index
  }))
}

// 拖拽经过
const handleDragOver = (event: DragEvent, index: number) => {
  if (!isEditingRoute.value || draggedIndex.value === null) return
  event.preventDefault()
  dragOverIndex.value = index
}

// 拖拽离开
const handleDragLeave = () => {
  dragOverIndex.value = null
}

// 放置：在 drop 的当前 selectedDay 里插入
const handleDrop = async (event: DragEvent, dropIndex: number) => {
  if (!isEditingRoute.value || selectedDay.value === null) return
  event.preventDefault()

  let srcIndex: number | null = draggedIndex.value
  try {
    const raw = event.dataTransfer?.getData('application/json')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.index === 'number') srcIndex = parsed.index
    }
  } catch {
    // ignore
  }

  if (srcIndex === null) return

  const day = selectedDay.value
  if (day === null || day === 0) return

  if (!itineraryDraftByDay.value.has(day)) itineraryDraftByDay.value.set(day, [])
  const items = [...(itineraryDraftByDay.value.get(day) || [])]

  if (srcIndex < 0 || srcIndex >= items.length) return

  // 同一位置不处理
  if (srcIndex === dropIndex) {
    draggedIndex.value = null
    dragOverIndex.value = null
    draggedDay.value = null
    return
  }

  const [moved] = items.splice(srcIndex, 1)
  const safeDropIndex = Math.min(Math.max(dropIndex, 0), items.length)
  items.splice(safeDropIndex, 0, moved)
  itineraryDraftByDay.value.set(day, items)

  // drop 后清理拖拽态
  draggedIndex.value = null
  dragOverIndex.value = null
  draggedDay.value = null

  // 1) 更新交通信息
  await refreshTransportForDay(day)

  // 2) 更新地图的路线显示（如果当前天正在展示地图）
  refreshRoute()
}

// 基于当前 trip 初始化草稿（按 day 分组并按 sequence 排序）
const initItineraryDraft = () => {
  const map: Map<number, ItineraryItem[]> = new Map<number, ItineraryItem[]>()
  if (!trip.value?.itinerary) {
    itineraryDraftByDay.value = map
    return
  }

  for (const item of trip.value.itinerary) {
    const day = item.day !== null && item.day !== undefined ? item.day : 0
    if (!map.has(day)) map.set(day, [] as ItineraryItem[])
    map.get(day)!.push(item)
  }

  for (const [day, items] of map.entries()) {
    items.sort((a: any, b: any) => getSequenceSafe(a) - getSequenceSafe(b))
    map.set(day, items)
  }

  itineraryDraftByDay.value = map
}

// 编辑模式下：重算某一天相邻地点的交通信息（只算“相邻对”）
const refreshTransportForDay = async (day: number) => {
  if (day === 0) return // 未规划不展示交通
  const items = itineraryDraftByDay.value.get(day) || []
  if (items.length < 2) return

  // 只请求相邻点的三种方式，避免全量请求
  const tasks: Promise<any>[] = []
  for (let i = 0; i < items.length - 1; i++) {
    const a: any = items[i]
    const b: any = items[i + 1]
    if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) continue
    if (shouldSkipTransport(a, b)) continue

    // drop 后希望立刻更新，所以先清掉旧 key，避免被“已有数据不加载”短路
    const key = `${a.id}-${b.id}`
    if (transportInfo.value[key]) {
      delete transportInfo.value[key]
    }

    tasks.push(fetchRouteBetweenPlaces(a, b, 'driving'))
    tasks.push(fetchRouteBetweenPlaces(a, b, 'transit'))
    tasks.push(fetchRouteBetweenPlaces(a, b, 'walking'))
  }

  // 并发执行，但不 await 也行；这里 await 让 UI 更快出现结果
  await Promise.all(tasks)
}

// 保存草稿到后端（按 day 分组分别调用 updatePlaceOrder）
const saveRouteDraft = async () => {
  if (!trip.value) return
  const tripId = Number(route.params.id)
  if (!tripId) {
    ElMessage.error('行程ID无效')
    return
  }

  // 只保存已规划 day（1..n），day=0 不支持顺序接口/也不展示交通
  const daysToSave = Array.from(itineraryDraftByDay.value.keys())
    .filter(d => d !== 0)
    .sort((a, b) => a - b)

  savingRoute.value = true
  try {
    for (const day of daysToSave) {
      const items = itineraryDraftByDay.value.get(day) || []
      const placeIds = items
        .map((it: any) => Number(it.placeId))
        .filter((id: number) => !Number.isNaN(id))

      const res = await tripApi.updatePlaceOrder(tripId, {
        day,
        placeIds
      })
      if (res.code !== 200) {
        ElMessage.error(res.message || '保存失败')
        return
      }
    }

    ElMessage.success('路线已保存')

    // 退出编辑模式并刷新服务端数据，确保 sequence/day 等字段一致
    isEditingRoute.value = false
    draggedIndex.value = null
    dragOverIndex.value = null
    draggedDay.value = null
    await loadTripDetail()
  } catch (error: any) {
    console.error('保存路线失败:', error)
    ElMessage.error(error?.message || '保存失败，请稍后再试')
  } finally {
    savingRoute.value = false
  }
}

// 格式化天数对应的日期
const formatDayDate = (day: number) => {
  if (!trip.value?.startDate) return ''
  const startDate = dayjs(trip.value.startDate)
  if (!startDate.isValid()) return ''
  const date = startDate.add(day - 1, 'day')
  return date.format('MM-DD')
}

// 根据天数获取日期字符串
const getDayDate = (day: number) => {
  if (!trip.value?.startDate) return ''
  const startDate = dayjs(trip.value.startDate)
  if (!startDate.isValid()) return ''
  const date = startDate.add(day - 1, 'day')
  return date.format('MM月DD日')
}

// 处理天数选择
const handleSelectDay = (day: number | null) => {
  selectedDay.value = day
}

// 加载百度地图
const loadBaiduMap = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).BMap) {
      resolve((window as any).BMap)
      return
    }

    const baiduAk = (import.meta as any).env?.VITE_BAIDU_MAP_AK || ''
    if (!baiduAk) {
      ElMessage.error('请配置百度地图AK环境变量：VITE_BAIDU_MAP_AK')
      reject(new Error('百度地图AK未配置'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${baiduAk}&callback=initBaiduMap`
    script.onerror = reject

    ;(window as any).initBaiduMap = () => {
      resolve((window as any).BMap)
    }

    document.head.appendChild(script)
  })
}

// 初始化地图
const initMap = async () => {
  try {
    await loadBaiduMap()
    await nextTick()

    const mapContainer = document.getElementById('baidu-map')
    if (!mapContainer) return

    mapInstance.value = new (window as any).BMap.Map('baidu-map')

    if (getCurrentDayPlaces.value.length > 0) {
      const firstPlace = getCurrentDayPlaces.value[0]
      const point = new (window as any).BMap.Point(firstPlace.lng, firstPlace.lat)
      mapInstance.value.centerAndZoom(point, 13)
    }

    mapLoaded.value = true
  } catch (error) {
    console.error('加载百度地图失败:', error)
    ElMessage.error('地图加载失败，请检查百度地图AK配置')
  }
}

// 调用百度路线规划API（使用JS API，带完整缓存）
const getRoute = async () => {
  const places = getCurrentDayPlaces.value
  if (places.length < 2) {
    ElMessage.warning('至少需要2个地点才能规划路线')
    return
  }

  if (!mapInstance.value) {
    ElMessage.warning('地图未初始化')
    return
  }

  routeLoading.value = true

  try {
    // 准备缓存检查的地点数据
    const cacheCheckPlaces = places.map(place => ({
      lng: place.lng,
      lat: place.lat,
      name: place.name
    }))

    // 1. 先检查缓存
    const cacheRes = await baiduRouteApi.checkRouteCache(cacheCheckPlaces)

    if (cacheRes.code === 200 && cacheRes.data) {
      // 缓存命中，直接使用缓存结果
      const cachedRoute = cacheRes.data

      // 清除之前的覆盖物
      mapInstance.value.clearOverlays()

      // 添加地点标记
      addPlaceMarkers(places)

      // 使用缓存的路线信息
      routeInfo.value = {
        distance: cachedRoute.distance || 0,
        duration: cachedRoute.duration || 0,
        toll: cachedRoute.toll || 0
      }

      // 如果缓存中有路线绘制数据，直接绘制
      // 兼容新旧字段名：routePolyline (新) 或 routePoints (旧)
      const polylineData = cachedRoute.routePolyline || cachedRoute.routePoints
      if (polylineData && polylineData.length > 0) {
        drawCachedRoute(polylineData, places)
      } else {
        // 如果缓存中没有绘制数据，调用API绘制并更新缓存
        callBaiduAPIForDrawing(places, true) // 改为 true，重新缓存完整数据
      }

      routeLoading.value = false
      return
    }

    // 2. 缓存未命中，调用百度地图API
    callBaiduAPIForDrawing(places, true)

  } catch (error) {
    console.error('获取路线失败:', error)
    ElMessage.error('获取路线失败')
    routeLoading.value = false
  }
}

// 调用百度地图API进行路线规划和绘制
const callBaiduAPIForDrawing = (places: any[], shouldCache: boolean) => {
  // 清除之前的覆盖物（包括路线和标记）
  mapInstance.value.clearOverlays()

  // 先添加地点标记
  addPlaceMarkers(places)

  // 准备缓存数据
  const cacheCheckPlaces = places.map(place => ({
    lng: place.lng,
    lat: place.lat,
    name: place.name
  }))

  // 使用百度地图JS API的路线规划（让百度地图自动绘制路线）
  const driveOptions: any = {
    renderOptions: {
      map: mapInstance.value, // 自动绘制到地图
      autoViewport: true, // 自动调整视野
      panel: null // 不显示路线面板
    },
    onSearchComplete: (result: any) => {
      routeLoading.value = false
      const status = driving.getStatus()

      // 使用数字比较，0 表示成功
      if (status === 0) {
        const plan = result.getPlan(0) // 获取第一条路线

        if (plan) {
          // 获取路线信息
          const distance = plan.getDistance(false) // 总距离（米）
          const duration = plan.getDuration(false) // 总时间（秒）

          // 提取路线绘制数据
          let routePolyline: Array<{lng: number, lat: number}> = []
          try {
            const route = plan.getRoute(0)
            if (route && typeof route.getPath === 'function') {
              const path = route.getPath()
              if (path && path.length > 0) {
                routePolyline = path.map((point: any) => ({
                  lng: point.lng,
                  lat: point.lat
                }))
              }
            }
          } catch (e) {
            console.warn('无法提取路线路径点:', e)
          }

          const routeData = {
            distance: distance,
            duration: duration,
            toll: 0, // JS API不提供过路费信息
            routePolyline: routePolyline, // 存储路线绘制数据
            timestamp: Date.now() // 添加时间戳
          }

          routeInfo.value = {
            distance: routeData.distance,
            duration: routeData.duration,
            toll: routeData.toll
          }

          // 3. 保存到缓存（如果需要）
          if (shouldCache) {
            void (async () => {
              try {
                await baiduRouteApi.saveRouteCache(cacheCheckPlaces, routeData)
              } catch (cacheError) {
                console.error('保存路线规划缓存失败:', cacheError)
                // 缓存失败不影响主要功能
              }
            })()
          }

          // 百度地图会自动绘制路线，我们只需要调整视野
          setTimeout(() => {
            adjustMapViewport(plan, places)
          }, 100) // 稍微延迟确保路线已绘制
        } else {
          console.error('未找到路线规划结果')
          ElMessage.error('未找到路线规划结果')
        }
      } else {
        let errorMsg = '路线规划失败'
        // 使用数字比较状态码
        if (status === 1) {
          errorMsg = '未找到路线，请检查起点和终点'
        } else if (status === 2) {
          errorMsg = '路线规划请求无效'
        }
        console.error('路线规划失败:', errorMsg, '状态码:', status)
        ElMessage.error(errorMsg)
      }
    }
  }

  const driving = new (window as any).BMap.DrivingRoute(mapInstance.value, driveOptions)

  // 设置起点和终点
  const startPoint = new (window as any).BMap.Point(places[0].lng, places[0].lat)
  const endPoint = new (window as any).BMap.Point(places[places.length - 1].lng, places[places.length - 1].lat)

  // 如果有途径点
  if (places.length > 2) {
    const waypoints: any[] = []
    for (let i = 1; i < places.length - 1; i++) {
      waypoints.push(new (window as any).BMap.Point(places[i].lng, places[i].lat))
    }
    // 搜索路线（百度地图会自动绘制）
    driving.search(startPoint, endPoint, { waypoints: waypoints })
  } else {
    // 搜索路线（百度地图会自动绘制）
    driving.search(startPoint, endPoint)
  }
}

// 添加地点标记的辅助函数
const addPlaceMarkers = (places: any[]) => {
  places.forEach((place, index) => {
    const point = new (window as any).BMap.Point(place.lng, place.lat)
    const marker = new (window as any).BMap.Marker(point)
    const infoWindow = new (window as any).BMap.InfoWindow(place.name, {
      width: 200,
      height: 50
    })

    marker.addEventListener('click', () => {
      mapInstance.value.openInfoWindow(infoWindow, point)
    })

    const label = new (window as any).BMap.Label(
      index === 0 ? '起点' : (index === places.length - 1 ? '终点' : `${index + 1}`),
      { offset: new (window as any).BMap.Size(20, -10) }
    )
    marker.setLabel(label)
    mapInstance.value.addOverlay(marker)
  })
}

// 绘制缓存的路线
const drawCachedRoute = (routePolyline: Array<{lng: number, lat: number}>, places: any[]) => {
  try {
    if (routePolyline.length < 2) {
      console.warn('缓存的路线路径点不足，无法绘制')
      return
    }

    // 将路径点转换为百度地图Point对象
    const points = routePolyline.map(point =>
      new (window as any).BMap.Point(point.lng, point.lat)
    )

    // 创建折线对象
    const polyline = new (window as any).BMap.Polyline(points, {
      strokeColor: '#3388ff',    // 路线颜色
      strokeWeight: 6,           // 路线宽度
      strokeOpacity: 0.8,        // 路线透明度
      strokeStyle: 'solid'       // 路线样式
    })

    // 添加折线到地图
    mapInstance.value.addOverlay(polyline)

    // 调整地图视野以包含整条路线和地点标记
    try {
      // 收集所有需要显示的点（路线点 + 地点标记）
      const allPoints = [...points]

      // 添加地点标记的坐标
      places.forEach(place => {
        allPoints.push(new (window as any).BMap.Point(place.lng, place.lat))
      })

      // 使用百度地图的 setViewport 方法调整视野
      mapInstance.value.setViewport(allPoints, {
        margins: [50, 50, 50, 50] // 设置边距
      })
    } catch (viewportError) {
      console.warn('调整地图视野失败，使用默认视野:', viewportError)
      // 如果调整视野失败，回退到调用百度地图API
      callBaiduAPIForDrawing(places, false)
    }
  } catch (error) {
    console.error('绘制缓存路线失败:', error)
    // 如果绘制失败，回退到调用百度地图API
    callBaiduAPIForDrawing(places, false)
  }
}


// 调整地图视野以包含所有地点和路线
const adjustMapViewport = (plan: any, places: any[]) => {
  if (!mapInstance.value) {
    console.error('地图实例不存在')
    return
  }

  try {
    // 收集所有地点坐标
    const allPoints: any[] = []
    places.forEach(place => {
      allPoints.push(new (window as any).BMap.Point(place.lng, place.lat))
    })

    // 尝试从路线规划结果中获取路线点来扩展视野
    try {
      const route = plan.getRoute(0)
      if (route && typeof route.getStartPoint === 'function' && typeof route.getEndPoint === 'function') {
        // 获取路线的起点和终点来扩展视野
        const startPoint = route.getStartPoint()
        const endPoint = route.getEndPoint()
        if (startPoint) allPoints.push(startPoint)
        if (endPoint) allPoints.push(endPoint)
      }
    } catch (e) {
      console.warn('无法获取路线点:', e)
    }

    if (allPoints.length > 0) {
      mapInstance.value.setViewport(allPoints)
    }
  } catch (error) {
    console.error('调整地图视野时出错:', error)
  }
}

// 刷新路线
const refreshRoute = () => {
  if (mapLoaded.value) {
    getRoute()
  } else {
    initMap().then(() => {
      getRoute()
    })
  }
}

// 初始化未规划地图（只显示地点标记，不规划路线）
const initUnplannedMap = async () => {
  try {
    await loadBaiduMap()
    await nextTick()

    const mapContainer = document.getElementById('unplanned-map')
    if (!mapContainer) return

    unplannedMapInstance.value = new (window as any).BMap.Map('unplanned-map')

    const places = getCurrentDayPlaces.value
    if (places.length > 0) {
      const firstPlace = places[0]
      const point = new (window as any).BMap.Point(firstPlace.lng, firstPlace.lat)
      unplannedMapInstance.value.centerAndZoom(point, 13)
    }

    unplannedMapLoaded.value = true
  } catch (error) {
    console.error('加载百度地图失败:', error)
    ElMessage.error('地图加载失败，请检查百度地图AK配置')
  }
}

// 显示未规划地点标记
const showUnplannedMarkers = () => {
  if (!unplannedMapInstance.value) return

  const places = getCurrentDayPlaces.value
  if (places.length === 0) return

  // 清除之前的覆盖物
  unplannedMapInstance.value.clearOverlays()

  // 添加地点标记
  const points: any[] = []
  places.forEach((place, index) => {
    const point = new (window as any).BMap.Point(place.lng, place.lat)
    points.push(point)

    const marker = new (window as any).BMap.Marker(point)
    const infoWindow = new (window as any).BMap.InfoWindow(place.name, {
      width: 200,
      height: 50
    })

    marker.addEventListener('click', () => {
      unplannedMapInstance.value.openInfoWindow(infoWindow, point)
    })

    const label = new (window as any).BMap.Label(`${index + 1}`, {
      offset: new (window as any).BMap.Size(20, -10)
    })
    marker.setLabel(label)
    unplannedMapInstance.value.addOverlay(marker)
  })

  // 调整视野以包含所有地点
  if (points.length > 0) {
    unplannedMapInstance.value.setViewport(points)
  }
}

// 刷新未规划地图
const refreshUnplannedMap = () => {
  if (unplannedMapLoaded.value) {
    showUnplannedMarkers()
  } else {
    initUnplannedMap().then(() => {
      showUnplannedMarkers()
    })
  }
}

// 格式化距离
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${meters}米`
  }
  return `${(meters / 1000).toFixed(1)}公里`
}

// 格式化时间
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

// 获取两个地点之间的交通信息
const getTransportInfo = (itemId1: string, itemId2: string) => {
  const key = `${itemId1}-${itemId2}`
  const info = transportInfo.value[key]
  if (!info) return null

  const hasLoadedData = (info.driving && !info.driving.loading && info.driving.distance > 0) ||
                        (info.transit && !info.transit.loading && info.transit.distance > 0) ||
                        (info.walking && !info.walking.loading && info.walking.distance > 0)

  return hasLoadedData ? info : null
}

// 检查交通信息是否正在加载
const isTransportInfoLoading = (itemId1: string, itemId2: string) => {
  const key = `${itemId1}-${itemId2}`
  const info = transportInfo.value[key]
  if (!info) return true // 如果没有信息，认为正在加载

  // 检查是否至少有一种方式正在加载
  return (info.driving && info.driving.loading) ||
         (info.transit && info.transit.loading) ||
         (info.walking && info.walking.loading)
}

// 获取两个地点之间的路线信息（调用后端API，后端管理缓存和百度地图API调用）
const fetchRouteBetweenPlaces = async (item1: any, item2: any, transportType: 'driving' | 'transit' | 'walking') => {
  if (!item1.lat || !item1.lng || !item2.lat || !item2.lng) {
    return
  }

  const key = `${item1.id}-${item2.id}`

  // 初始化交通信息对象
  if (!transportInfo.value[key]) {
    transportInfo.value[key] = {}
  }

  // 如果已经有数据且不在加载中，直接返回
  if (transportInfo.value[key][transportType] && !transportInfo.value[key][transportType].loading) {
    return
  }

  // 设置加载状态
  transportInfo.value[key][transportType] = {
    distance: 0,
    duration: 0,
    loading: true
  }

  try {
    // 调用后端API查询交通信息（后端会自动检查缓存、调用百度地图API、保存缓存）
    const res = await transportInfoApi.queryTransportInfo(
      item1.lng, item1.lat, item2.lng, item2.lat, transportType
    )

    if (res.code === 200 && res.data) {
      // 更新交通信息
      transportInfo.value[key] = {
        ...transportInfo.value[key],
        [transportType]: {
          distance: res.data.distance || 0,
          duration: res.data.duration || 0,
          loading: false
        }
      }
    } else {
      // 查询失败
      transportInfo.value[key][transportType] = {
        distance: 0,
        duration: 0,
        loading: false
      }
    }
  } catch (error) {
    console.error('获取交通信息失败:', error)
    if (transportInfo.value[key]) {
      transportInfo.value[key][transportType] = {
        distance: 0,
        duration: 0,
        loading: false
      }
    }
  }
}


// 获取地点建议
const fetchPlaceSuggestions = async (queryString: string, cb: (suggestions: any[]) => void) => {
  if (!queryString.trim()) {
    cb([])
    return
  }

  try {
    const tripId = Number(route.params.id)
    const res = await tripApi.getPlaceSuggestions(tripId, queryString.trim())

    if (res.code === 200 && res.data) {
      const suggestions = res.data.map((item: any) => ({
        value: item.name,
        name: item.name,
        uid: item.uid
      }))
      cb(suggestions)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('获取地点建议失败:', error)
    cb([])
  }
}

// 选择地点
const handlePlaceSelect = (item: any) => {
  itineraryForm.value.placeUid = item.uid
  // 设置默认地点类型（如果有的话）
  if (placeTypes.value.length > 0) {
    itineraryForm.value.placeType = placeTypes.value[0].id
  }
  selectedPlace.value = {
    name: item.name,
    uid: item.uid,
    type: '地点',
    address: ''
  }
}

// 获取选中的地点类型名称
const getSelectedTypeName = () => {
  if (!itineraryForm.value.placeType) return '未选择'
  const type = placeTypes.value.find(t => t.id === itineraryForm.value.placeType)
  return type ? type.name : '未知类型'
}

// 添加行程安排
const handleAddItinerary = async () => {
  if (!itineraryFormRef.value) return

  try {
    await itineraryFormRef.value.validate()

    if (!itineraryForm.value.placeUid) {
      ElMessage.error('请选择一个地点')
      return
    }

    addingItinerary.value = true
    const tripId = Number(route.params.id)

    const res = await tripApi.addPlaceToTrip(tripId, {
      uid: itineraryForm.value.placeUid,
      day: itineraryForm.value.day,
      typeId: itineraryForm.value.placeType ?? undefined
    })

    if (res.code === 200) {
      ElMessage.success('行程安排添加成功')
      showAddItinerary.value = false

      // 重置表单
      itineraryForm.value = {
        day: 0,
        placeName: '',
        placeUid: '',
        placeType: null
      }
      selectedPlace.value = null

      // 重新加载行程详情
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error: any) {
    console.error('添加行程安排失败:', error)
    ElMessage.error(error.message || '添加失败，请稍后再试')
  } finally {
    addingItinerary.value = false
  }
}

const editItineraryItem = (item: any) => {
  currentEditItem.value = item
  editItineraryForm.value = {
    day: item.day !== null && item.day !== undefined ? item.day : 0,
    placeType: item.typeId || null
  }
  showEditItinerary.value = true
}

const deleteItineraryItem = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地点吗？', '确认删除', {
      type: 'warning'
    })

    const tripId = Number(route.params.id)
    const placeId = item?.placeId ?? item?.id

    if (!placeId) {
      ElMessage.error('无法获取地点ID')
      return
    }

    const res = await tripApi.deletePlace(tripId, Number(placeId))

    if (res.code === 200) {
      ElMessage.success('地点已删除')
      // 重新拉取
      await loadTripDetail()

      if (shouldShowMap.value) {
        await refreshRoute()
      } else if (shouldShowUnplannedMap.value) {
        await refreshUnplannedMap()
      }
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close' && error?.message !== 'cancel' && error?.message !== 'close') {
      console.error('删除地点失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    }
  }
}

const changeRole = async (member: TripMember) => {
  try {
    const currentRole = member.role
    const roleOptions = [
      { label: '参与者', value: 'member', backendValue: 2 },
      { label: '管理员', value: 'admin', backendValue: 1 }
    ]

    // 过滤掉当前角色
    const availableRoles = roleOptions.filter(opt => opt.value !== currentRole)

    if (availableRoles.length === 0) {
      ElMessage.warning('没有可更改的角色')
      return
    }

    // 如果只有一个选项，直接确认
    if (availableRoles.length === 1) {
      const selectedRoleOption = availableRoles[0]
      await ElMessageBox.confirm(
        `确定将 "${member.username}" 的角色更改为 "${selectedRoleOption.label}" 吗？`,
        '更改角色',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      const tripId = Number(route.params.id)
      const res = await tripApi.updateMemberRole(tripId, {
        userId: Number(member.userId),
        role: selectedRoleOption.backendValue
      })

      if (res.code === 200) {
        ElMessage.success('角色已更新')
        await loadTripDetail()
      } else {
        ElMessage.error(res.message || '更新角色失败')
      }
      return
    }

    // 多个选项时，使用 prompt 让用户输入选项编号
    const optionsText = availableRoles.map((opt, index) => `${index + 1}. ${opt.label}`).join('\n')
    const promptMessage = `请选择新角色：\n\n${optionsText}\n\n请输入选项编号（1-${availableRoles.length}）：`

    const { value } = await ElMessageBox.prompt(
      promptMessage,
      '更改角色',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: new RegExp(`^[1-${availableRoles.length}]$`),
        inputErrorMessage: `请输入 1 到 ${availableRoles.length} 之间的数字`
      }
    )

    if (!value) return

    const selectedIndex = parseInt(value) - 1
    if (selectedIndex < 0 || selectedIndex >= availableRoles.length) {
      ElMessage.error('无效的选项')
      return
    }

    const selectedRoleOption = availableRoles[selectedIndex]

    const tripId = Number(route.params.id)
    const res = await tripApi.updateMemberRole(tripId, {
      userId: Number(member.userId),
      role: selectedRoleOption.backendValue
    })

    if (res.code === 200) {
      ElMessage.success('角色已更新')
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '更新角色失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('更改角色失败:', error)
      ElMessage.error(error.message || '更改角色失败，请稍后再试')
    }
  }
}

const removeMember = async (member: TripMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除成员 "${member.username}" 吗？`,
      '确认移除',
      {
        type: 'warning'
      }
    )

    // 注意：这里需要后端提供移除成员的接口
    // 目前只能通过退出行程的方式，但那是用户自己操作
    // 暂时提示功能未实现
    ElMessage.warning('移除成员功能待实现')
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('移除成员失败:', error)
      ElMessage.error(error.message || '移除成员失败，请稍后再试')
    }
  }
}

// 处理编辑行程安排
const handleEditItinerary = async () => {
  if (!editItineraryFormRef.value || !currentEditItem.value) return

  try {
    await editItineraryFormRef.value.validate()

    editingItinerary.value = true
    const tripId = Number(route.params.id)
    const placeId = currentEditItem.value.placeId

    if (!placeId) {
      ElMessage.error('无法获取地点ID')
      return
    }

    const res = await tripApi.updatePlace(tripId, Number(placeId), {
      day: editItineraryForm.value.day,
      typeId: editItineraryForm.value.placeType ?? undefined
    })

    if (res.code === 200) {
      ElMessage.success('行程安排已更新')
      showEditItinerary.value = false

      // 重置表单
      editItineraryForm.value = {
        day: 1,
        placeType: null
      }
      currentEditItem.value = null

      // 重新加载行程详情
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新行程安排失败:', error)
    ElMessage.error(error.message || '更新失败，请稍后再试')
  } finally {
    editingItinerary.value = false
  }
}

// 邀请成员
const handleInviteMember = async () => {
  if (!inviteFormRef.value) return

  try {
    await inviteFormRef.value.validate()
  } catch (error) {
    return
  }

  if (!trip.value) {
    ElMessage.error('行程信息不存在')
    return
  }

  inviteLoading.value = true
  try {
    const res = await tripApi.createInvitation(Number(trip.value.id), inviteForm.value.invitee)
    if (res.code === 200) {
      ElMessage.success('邀请已发送')
      showInviteMember.value = false
      // 重置表单
      inviteForm.value.invitee = ''
      inviteFormRef.value?.clearValidate()
      // 刷新行程详情以更新成员列表
      await loadTripDetail()
      // 重新加载待接受邀请
      await loadPendingInvitations(Number(trip.value.id))
    } else {
      ElMessage.error(res.message || '发送邀请失败')
    }
  } catch (error: any) {
    console.error('发送邀请失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '发送邀请失败，请稍后再试'
    ElMessage.error(errorMessage)
  } finally {
    inviteLoading.value = false
  }
}

// 取消邀请对话框
const handleCancelInvite = () => {
  showInviteMember.value = false
  inviteForm.value.invitee = ''
  inviteFormRef.value?.clearValidate()
}

// 撤销邀请
const cancelInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要撤销这个邀请吗？', '确认撤销', {
      type: 'warning'
    })

    const res = await invitationApi.cancelInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已撤销邀请')
      // 重新加载待接受邀请
      if (trip.value) {
        await loadPendingInvitations(Number(trip.value.id))
      }
    } else {
      ElMessage.error(res.message || '撤销邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('撤销邀请失败:', error)
      ElMessage.error(error.message || '撤销邀请失败')
    }
  }
}

// 批量导入地点
const handleBatchImport = async () => {
  const text = batchImportText.value.trim()
  if (!text) {
    ElMessage.warning('请输入要导入的地点')
    return
  }

  const tripId = Number(route.params.id)
  if (!tripId) {
    ElMessage.error('行程ID无效')
    return
  }

  try {
    batchImporting.value = true

    // 1) 调用后端批量导入
    const res = await tripApi.importPlaces(tripId, text)
    if (res.code !== 200) {
      ElMessage.error(res.message || '批量导入失败')
      return
    }

    // 2) 将导入的地点全部设置为未规划(day=0)
    const imported = Array.isArray(res.data) ? res.data : []
    await Promise.all(
      imported
        .map((p: any) => p?.id)
        .filter((id: any) => typeof id === 'number' || typeof id === 'string')
        .map((id: any) => tripApi.updatePlace(tripId, Number(id), { day: 0 }))
    )

    ElMessage.success(`已导入 ${imported.length} 个地点，已放入未规划`) // imported.length 可能为 0
    showBatchImport.value = false
    batchImportText.value = ''

    await loadTripDetail()
  } catch (error: any) {
    console.error('批量导入地点失败:', error)
    ElMessage.error(error.message || '批量导入失败，请稍后再试')
  } finally {
    batchImporting.value = false
  }
}


// 查看地点详情
const handleShowPlaceDetail = async (item: any) => {
  const tripId = Number(route.params.id)
  const placeId = Number(item?.placeId)

  if (!tripId || !placeId) {
    ElMessage.warning('无法获取地点信息')
    return
  }

  showPlaceDetail.value = true
  placeDetailLoading.value = true
  placeDetail.value = null

  try {
    const res = await tripApi.getPlaceDetail(tripId, placeId)
    if (res.code === 200 && res.data) {
      placeDetail.value = res.data
    } else {
      ElMessage.error(res.message || '加载地点详情失败')
    }
  } catch (error: any) {
    console.error('加载地点详情失败:', error)
    ElMessage.error(error.message || '加载地点详情失败')
  } finally {
    placeDetailLoading.value = false
  }
}
</script>

<style scoped>
.trip-detail {
  max-width: 1400px;
  margin: 0 auto;
}

/* 行程头部样式 */
.trip-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.trip-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.trip-info {
  flex: 1;
}

.trip-info h1 {
  margin: 0 0 16px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1d29 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.trip-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.trip-meta .el-icon {
  margin-right: 6px;
  color: #667eea;
  font-size: 16px;
}

.trip-meta .destination,
.trip-meta .date-range {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-weight: 500;
}

.trip-description {
  margin: 0;
  color: #666;
  line-height: 1.8;
  font-size: 15px;
  padding: 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.trip-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.trip-actions .el-button {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.trip-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 标签页样式 */
.trip-tabs {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.trip-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.trip-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  padding: 0 24px;
  height: 48px;
  line-height: 48px;
}

.trip-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 3px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.date-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.date-buttons .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.date-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.day-group {
  margin-bottom: 40px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.day-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
}

.day-count {
  font-size: 13px;
  color: #8c8c8c;
  padding: 4px 12px;
  background: #ffffff;
  border-radius: 12px;
  font-weight: 500;
}

.day-date {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
  margin-left: auto;
}

.itinerary-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  margin-bottom: 16px;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.itinerary-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px 0 0 2px;
  opacity: 0;
  transition: opacity 0.3s;
}

.itinerary-item:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  border-color: rgba(102, 126, 234, 0.3);
}

.itinerary-item:hover::before {
  opacity: 1;
}

/* 拖拽相关样式 */
.draggable-item {
  cursor: grab;
}

.draggable-item:active {
  cursor: grabbing;
}

.dragging {
  opacity: 0.5;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
  border-color: #667eea;
  z-index: 1000;
}

.drag-over {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.05);
  transform: translateY(-1px);
}

.drag-over::before {
  background: #67c23a;
  opacity: 1;
}

.item-type-icon {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.item-type-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.type-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-title {
  font-weight: 600;
  color: #1a1d29;
  font-size: 16px;
}

.item-location, .item-description, .item-cost {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.6;
}

.item-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  font-weight: 500;
}

.item-location .el-icon {
  font-size: 16px;
}

.item-cost {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: flex-start;
}

.item-actions .el-button {
  border-radius: 8px;
  transition: all 0.2s;
}

.item-actions .el-button:hover {
  transform: scale(1.1);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.member-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.member-card:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  border-color: rgba(102, 126, 234, 0.3);
}

.member-card:hover::before {
  opacity: 1;
}

.member-card :deep(.el-avatar) {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 700;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1d29;
  font-size: 16px;
}

.member-joined {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.member-joined::before {
  content: '🕐';
  font-size: 12px;
}

.pending-invitation {
  opacity: 0.9;
  border-color: #e6a23c;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.05) 0%, rgba(230, 162, 60, 0.05) 100%);
}

.pending-invitation::before {
  background: linear-gradient(135deg, #e6a23c 0%, #f39c12 100%);
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 添加行程安排对话框样式 */
.add-itinerary-dialog-modern :deep(.el-dialog),
.batch-import-dialog-modern :deep(.el-dialog),
.edit-itinerary-dialog-modern :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.add-itinerary-dialog-modern :deep(.el-dialog__header),
.batch-import-dialog-modern :deep(.el-dialog__header),
.edit-itinerary-dialog-modern :deep(.el-dialog__header) {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 0;
}

.add-itinerary-dialog-modern :deep(.el-dialog__body),
.batch-import-dialog-modern :deep(.el-dialog__body),
.edit-itinerary-dialog-modern :deep(.el-dialog__body) {
  padding: 28px;
}

.add-itinerary-dialog-modern :deep(.el-dialog__footer),
.batch-import-dialog-modern :deep(.el-dialog__footer),
.edit-itinerary-dialog-modern :deep(.el-dialog__footer) {
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.dialog-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-header-modern .header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-header-modern .header-icon {
  font-size: 20px;
  color: #667eea;
}

.dialog-header-modern .header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 表单样式 */
.itinerary-form-modern :deep(.el-form-item__label),
.batch-import-form-modern :deep(.el-form-item__label) {
  font-weight: 600;
  color: #1a1d29;
  font-size: 14px;
}

.itinerary-form-modern :deep(.el-input__wrapper),
.batch-import-form-modern :deep(.el-input__wrapper),
.form-select-modern :deep(.el-input__wrapper),
.form-autocomplete-modern :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s;
  padding: 8px 12px;
}

.itinerary-form-modern :deep(.el-input__wrapper):hover,
.batch-import-form-modern :deep(.el-input__wrapper):hover,
.form-select-modern :deep(.el-input__wrapper):hover,
.form-autocomplete-modern :deep(.el-input__wrapper):hover {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
}

.itinerary-form-modern :deep(.el-input__wrapper.is-focus),
.batch-import-form-modern :deep(.el-input__wrapper.is-focus),
.form-select-modern :deep(.el-input__wrapper.is-focus),
.form-autocomplete-modern :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset;
}

.form-select-modern :deep(.el-select__wrapper),
.form-autocomplete-modern :deep(.el-autocomplete__wrapper) {
  border-radius: 10px;
}

.input-icon {
  color: #667eea;
  font-size: 16px;
}

/* 建议项样式 */
.suggestion-item-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  transition: all 0.2s;
}

.suggestion-item-modern:hover {
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  padding-left: 8px;
  padding-right: 8px;
}

.suggestion-icon {
  color: #667eea;
  font-size: 16px;
  flex-shrink: 0;
}

.suggestion-name {
  font-weight: 500;
  color: #1a1d29;
  font-size: 14px;
}

/* 已选择地点样式 */
.selected-place-modern {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  border-left: 4px solid #67c23a;
}

.selected-place-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(103, 194, 58, 0.2);
}

.selected-icon {
  color: #67c23a;
  font-size: 20px;
}

.selected-place-header h4 {
  margin: 0;
  color: #1a1d29;
  font-size: 16px;
  font-weight: 600;
}

.place-info-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border-radius: 8px;
}

.info-label {
  font-weight: 600;
  color: #667eea;
  min-width: 60px;
  flex-shrink: 0;
}

.info-value {
  color: #1a1d29;
  flex: 1;
  word-break: break-word;
}

/* 文本域样式 */
.textarea-wrapper-modern {
  position: relative;
  width: 100%;
}

.form-textarea-modern {
  width: 100%;
}

.batch-import-form-modern :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.form-textarea-modern :deep(.el-textarea) {
  width: 100%;
}

.form-textarea-modern :deep(.el-textarea__inner) {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s;
  font-family: inherit;
}


.form-tip-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 8px;
  border-left: 3px solid #667eea;
  font-size: 13px;
  color: #666;
  width: 100%;
  box-sizing: border-box;
}

/* 对话框底部按钮 */
.dialog-footer-modern {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn-modern,
.submit-btn-modern {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 100px;
}

.cancel-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.submit-btn-modern {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 操作按钮样式 */
.action-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.place-info strong {
  color: #333;
}

/* 地图相关样式 */
.route-map-container {
  margin-top: 24px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.map-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-header h4::before {
  content: '🗺️';
  font-size: 20px;
}

.map-header .el-button {
  border-radius: 8px;
  font-weight: 500;
}

.baidu-map {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.route-info {
  margin-top: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  font-size: 14px;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.route-info .el-row {
  display: flex;
  gap: 24px;
}

.route-info .el-col {
  flex: 1;
}

.route-info-item {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.section-actions .el-button {
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s;
}

.section-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.clickable {
  cursor: pointer;
  transition: color 0.2s;
}

.clickable:hover {
  color: #667eea;
}

/* 交通信息样式 */
.transport-info-item {
  margin: 16px 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
  transition: all 0.3s;
}

.transport-info-item:hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateX(4px);
}

.transport-info-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.transport-icon {
  color: #667eea;
  font-size: 24px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
}

.transport-details {
  flex: 1;
}

.transport-modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.transport-mode {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  font-weight: 500;
}

.transport-mode .el-icon {
  color: #667eea;
  font-size: 18px;
}

.transport-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #8c8c8c;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
}

.transport-loading .el-icon {
  font-size: 18px;
  color: #667eea;
}

/* 邀请成员对话框样式 */
:deep(.invite-member-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.invite-member-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.invite-dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.invite-dialog-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.invite-dialog-icon {
  font-size: 20px;
  color: white;
}

:deep(.invite-member-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

:deep(.invite-member-dialog .el-dialog__headerbtn) {
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}

:deep(.invite-member-dialog .el-dialog__headerbtn:hover) {
  background: rgba(0, 0, 0, 0.05);
}

:deep(.invite-member-dialog .el-dialog__body) {
  padding: 28px;
}

/* 邀请表单样式 */
.invite-form {
  margin-top: 8px;
}

.invite-form-item {
  margin-bottom: 0;
}

.invite-form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.invite-form-label .el-icon {
  color: #667eea;
  font-size: 16px;
}

.label-text {
  display: inline-flex;
  align-items: center;
}

.required-mark {
  color: #f56c6c;
  margin-right: 4px;
  font-weight: 600;
}

/* 隐藏 Element Plus 默认的必填标记 */
:deep(.invite-form-item.is-required .el-form-item__label::before) {
  display: none;
}

:deep(.invite-input .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
}

:deep(.invite-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
  background: rgba(255, 255, 255, 1);
}

:deep(.invite-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

:deep(.invite-input .el-input__inner) {
  font-size: 15px;
}

.invite-form-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 10px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.tip-icon {
  font-size: 16px;
  color: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 对话框底部 */
.invite-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.invite-cancel-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #374151;
  transition: all 0.2s ease;
}

.invite-cancel-button:hover {
  background: #f9fafb;
  border-color: rgba(0, 0, 0, 0.15);
}

.invite-submit-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.invite-submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.invite-submit-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 表单验证错误样式 */
:deep(.invite-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.invite-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
  padding-left: 4px;
}
</style>

